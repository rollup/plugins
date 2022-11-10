import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';

import serializeJavascript from 'serialize-javascript';

import { hasOwnProperty, isObject } from 'smob';

import { minify } from 'terser';

import { WorkerContext, WorkerContextSerialized, WorkerOutput } from './type';

/**
 * Duck typing worker context.
 *
 * @param input
 */
function isWorkerContextSerialized(input: unknown): input is WorkerContextSerialized {
  return (
    isObject(input) &&
    hasOwnProperty(input, 'code') &&
    typeof input.code === 'string' &&
    hasOwnProperty(input, 'options') &&
    typeof input.options === 'string'
  );
}

export async function callWorker(filePath: string, context: WorkerContext) {
  return new Promise<WorkerOutput>((resolve, reject) => {
    const worker = new Worker(filePath, {
      workerData: {
        code: context.code,
        options: serializeJavascript(context.options)
      }
    });

    worker.on('message', (data) => resolve(data));

    worker.on('error', reject);

    worker.on('exit', (code) => {
      if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
    });
  });
}

export async function runWorker() {
  if (isMainThread || !parentPort || !isWorkerContextSerialized(workerData)) {
    return;
  }

  // eslint-disable-next-line no-eval
  const eval2 = eval;

  const options = eval2(`(${workerData.options})`);

  const result = await minify(workerData.code, options);

  const output: WorkerOutput = {
    code: result.code || workerData.code,
    nameCache: options.nameCache
  };

  parentPort.postMessage(output);
}
