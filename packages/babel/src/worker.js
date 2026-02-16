import { parentPort } from 'worker_threads';

import transformCode from './transformCode.js';

parentPort.on('message', async (opts) => {
  try {
    const result = await transformCode({
      ...opts,
      error: (msg) => {
        throw new Error(msg);
      }
    });
    parentPort.postMessage({
      result
    });
  } catch (error) {
    parentPort.postMessage({
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      }
    });
  }
});
