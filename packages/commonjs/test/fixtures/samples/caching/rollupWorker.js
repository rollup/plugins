const { workerData, parentPort } = require('worker_threads');

const { rollup } = require('rollup');

generateCode(workerData);

async function generateCode(cache) {
  const commonjs = (await import('current-package')).default;
  const { getCodeFromBundle } = await import('../../../helpers/util.mjs');
  const code = await getCodeFromBundle(
    await rollup({
      input: 'fixtures/samples/caching/main.js',
      cache,
      plugins: [commonjs()]
    })
  );

  parentPort.postMessage(code);
}
