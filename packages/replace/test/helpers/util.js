const { log } = console;

const execute = (code, context = {}, t) => {
  let fn;
  const contextKeys = Object.keys(context);
  const argNames = contextKeys.concat('module', 'exports', 't', code);

  try {
    fn = new Function(...argNames); // eslint-disable-line no-new-func
  } catch (err) {
    // syntax error
    log(code);
    throw err;
  }
  const module = { exports: {} };
  const argValues = contextKeys.map((key) => context[key]).concat(module, module.exports, t);

  fn(...argValues);

  return module.exports;
};

const getOutputFromGenerated = (generated) => (generated.output ? generated.output[0] : generated);

const getCodeFromBundle = async (bundle, customOptions = {}) => {
  const options = Object.assign({ format: 'cjs' }, customOptions);
  return getOutputFromGenerated(await bundle.generate(options)).code;
};

module.exports = { execute, getCodeFromBundle, getOutputFromGenerated };
