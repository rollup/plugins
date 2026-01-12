import workerpool from 'workerpool';

import transformCode from './transformCode.js';

async function transform(opts) {
  return transformCode({
    ...opts,
    error: (msg) => {
      throw new Error(msg);
    }
  });
}

workerpool.worker({
  transform
});
