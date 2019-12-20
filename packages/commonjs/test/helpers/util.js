const relative = require('require-relative');

const commonjsPlugin = require('../../dist/index');

function commonjs(options) {
  delete require.cache[require.resolve('../..')];
  return commonjsPlugin(options);
}

function execute(code, context = {}, t) {
  let fn;
  const contextKeys = Object.keys(context);
  const argNames = contextKeys.concat(
    'module',
    'exports',
    'require',
    'global',
    't',
    'globalThis',
    code
  );

  try {
    fn = new Function(...argNames); // eslint-disable-line no-new-func
  } catch (err) {
    // syntax error
    console.log(code); // eslint-disable-line no-console
    throw err;
  }

  const module = { exports: {} };
  const global = {};

  const argValues = contextKeys
    .map((key) => context[key])
    .concat(module, module.exports, (name) => relative(name, 'test/x.js'), global, t, global);

  fn(...argValues);

  return {
    code,
    exports: module.exports,
    global
  };
}

const getOutputFromGenerated = (generated) => (generated.output ? generated.output[0] : generated);

async function getCodeFromBundle(bundle, customOptions = {}) {
  const options = Object.assign({ format: 'cjs' }, customOptions);
  return getOutputFromGenerated(await bundle.generate(options)).code;
}

async function executeBundle(bundle, t, { context, exports } = {}) {
  const code = await getCodeFromBundle(bundle, exports ? { exports } : {});
  return execute(code, context, t);
}

module.exports = {
  commonjs,
  execute,
  getOutputFromGenerated,
  getCodeFromBundle,
  executeBundle
};
