import { Worker } from 'worker_threads';
import { cpus } from 'os';
import { EventEmitter } from 'events';

import serializeJavascript from 'serialize-javascript';

import type {
  WorkerCallback,
  WorkerContext,
  WorkerOutput,
  WorkerPoolOptions,
  WorkerPoolTask
} from './type';

const symbol = Symbol.for('FreeWoker');

export class WorkerPool extends EventEmitter {
  protected maxInstances: number;

  protected filePath: string;

  protected tasks: WorkerPoolTask[] = [];

  protected workers = 0;

  constructor(options: WorkerPoolOptions) {
    super();

    this.maxInstances = options.maxWorkers || cpus().length;
    this.filePath = options.filePath;

    this.on(symbol, () => {
      if (this.tasks.length > 0) {
        this.run();
      }
    });
  }

  add(context: WorkerContext, cb: WorkerCallback) {
    this.tasks.push({
      context,
      cb
    });

    if (this.workers >= this.maxInstances) {
      return;
    }

    this.run();
  }

  async addAsync(context: WorkerContext): Promise<WorkerOutput> {
    return new Promise((resolve, reject) => {
      this.add(context, (err, output) => {
        if (err) {
          reject(err);
          return;
        }

        if (!output) {
          reject(new Error('The output is empty'));
          return;
        }

        resolve(output);
      });
    });
  }

  private run() {
    if (this.tasks.length === 0) {
      return;
    }

    const task = this.tasks.shift();

    if (typeof task === 'undefined') {
      return;
    }

    this.workers += 1;

    let called = false;
    const callCallback = (err: Error | null, output?: WorkerOutput) => {
      if (called) {
        return;
      }
      called = true;

      this.workers -= 1;

      task.cb(err, output);
      this.emit(symbol);
    };

    const worker = new Worker(this.filePath, {
      workerData: {
        code: task.context.code,
        options: serializeJavascript(task.context.options)
      }
    });

    worker.on('message', (data) => {
      callCallback(null, data);
    });

    worker.on('error', (err) => {
      callCallback(err);
    });

    worker.on('exit', (code) => {
      if (code !== 0) {
        callCallback(new Error(`Minify worker stopped with exit code ${code}`));
      }
    });
  }
}
