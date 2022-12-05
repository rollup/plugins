import process from 'process';
import { isMainThread, parentPort, workerData } from 'worker_threads';

import { hasOwnProperty, isObject } from 'smob';

import { minify } from 'terser';

import type { WorkerContextSerialized, WorkerOutput } from './type';

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

export async function runWorker() {
  if (isMainThread || !parentPort || !isWorkerContextSerialized(workerData)) {
    return;
  }

  try {
    // eslint-disable-next-line no-eval
    const eval2 = eval;

    const options = eval2(`(${workerData.options})`);

    const result = await minify(workerData.code, options);

    const output: WorkerOutput = {
      code: result.code || workerData.code,
      nameCache: options.nameCache
    };

    parentPort.postMessage(output);
  } catch (e) {
    process.exit(1);
  }
}
