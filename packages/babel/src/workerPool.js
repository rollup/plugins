import { Worker } from 'worker_threads';

export default class WorkerPool {
  workers = [];
  availableWorkers = [];

  pendingTasks = [];
  runningTasks = new Map();

  constructor(workerScript, poolSize) {
    this.workerScript = workerScript;
    this.poolSize = poolSize;
  }

  createWorker() {
    const worker = new Worker(this.workerScript);

    worker.on('message', (message) => {
      const { result, error } = message;
      const runningTask = this.runningTasks.get(worker);

      if (runningTask) {
        this.runningTasks.delete(worker);

        if (error) {
          const err = new Error(error.message);
          err.name = error.name;
          err.stack = error.stack;
          runningTask.reject(err);
        } else {
          runningTask.resolve(result);
        }

        this.availableWorkers.push(worker);
        this.processQueue();
      }
    });

    worker.on('error', (error) => {
      // Unexpected worker error, remove from pool

      const workerIdx = this.workers.indexOf(worker);
      if (workerIdx === -1) return;
      this.workers.splice(workerIdx, 1);

      const availableIdx = this.availableWorkers.indexOf(worker);
      if (availableIdx !== -1) {
        this.availableWorkers.splice(availableIdx, 1);
      }

      const runningTask = this.runningTasks.get(worker);
      if (runningTask) {
        this.runningTasks.delete(worker);
        runningTask.reject(error);
      }

      this.processQueue();
    });

    this.workers.push(worker);
    return worker;
  }

  getAvailableWorker() {
    if (this.availableWorkers.length > 0) {
      return this.availableWorkers.shift();
    }
    if (this.workers.length < this.poolSize) {
      return this.createWorker();
    }
    return null;
  }

  processQueue() {
    while (this.pendingTasks.length > 0) {
      const worker = this.getAvailableWorker();
      if (!worker) break;

      const task = this.pendingTasks.shift();

      this.runningTasks.set(worker, task);

      worker.postMessage(task.opts);
    }
  }

  async runTask(opts) {
    const taskPromise = new Promise((resolve, reject) => {
      this.pendingTasks.push({
        resolve,
        reject,
        opts
      });
    });

    this.processQueue();

    return taskPromise;
  }

  async terminate() {
    for (const [, { reject }] of this.runningTasks.entries()) {
      reject(new Error('Worker pool is terminating'));
    }
    this.runningTasks.clear();
    this.pendingTasks.length = 0;

    const terminatePromises = this.workers.map((worker) =>
      worker.terminate().catch((err) => {
        console.error('Error terminating worker:', err);
      })
    );

    await Promise.all(terminatePromises);

    this.workers.length = 0;
    this.availableWorkers.length = 0;
  }
}
