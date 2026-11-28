const { workerData, parentPort } = require('worker_threads');

const { rollup } = require(workerData.rollupPath);

const commonjs = require('../../../..');
const { getCodeFromBundle } = require('../../../helpers/util');

generateCode(workerData.cache);

async function generateCode(cache) {
  const code = await getCodeFromBundle(
    await rollup({
      input: 'fixtures/samples/caching/main.js',
      cache,
      plugins: [commonjs()]
    })
  );

  parentPort.postMessage(code);
}
