const path = require('path');

const commonjsPlugin = require('../..');

function commonjs(options) {
  delete require.cache[require.resolve('../..')];
  return commonjsPlugin(options);
}

function requireWithContext(code, context) {
  const module = { exports: {} };
  const contextWithExports = { ...context, module, exports: module.exports };
  const contextKeys = Object.keys(contextWithExports);
  const contextValues = contextKeys.map((key) => contextWithExports[key]);
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function(contextKeys, code);
    fn.apply({}, contextValues);
  } catch (error) {
    error.exports = module.exports;
    throw error;
  }
  return contextWithExports.module.exports;
}

function runCodeSplitTest(codeMap, t, configContext = {}) {
  const requireFromOutputVia = (importer) => (importee) => {
    const outputId = path.posix.join(path.posix.dirname(importer), importee);
    const code = codeMap[outputId];
    if (typeof code !== 'undefined') {
      return requireWithContext(
        code,
        // eslint-disable-next-line no-use-before-define
        { require: requireFromOutputVia(outputId), ...context }
      );
    }
    // eslint-disable-next-line import/no-dynamic-require, global-require
    return require(importee);
  };

  const chunkNames = Object.keys(codeMap);
  const entryName = chunkNames.length === 1 ? chunkNames[0] : 'main.js';
  if (!codeMap[entryName]) {
    throw new Error(
      `Could not find entry "${entryName}" in generated output.\nChunks:\n${Object.keys(
        codeMap
      ).join('\n')}`
    );
  }
  const global = {};
  const context = { t, global, globalThis: global, ...configContext };
  let exports;
  try {
    exports = requireWithContext(codeMap[entryName], {
      require: requireFromOutputVia('main.js'),
      ...context
    });
  } catch (error) {
    return { error, exports: error.exports };
  }
  return { exports, global };
}

async function getCodeMapFromBundle(bundle, options = {}) {
  const generated = await bundle.generate({ exports: 'auto', format: 'cjs', ...options });
  const codeMap = {};
  for (const chunk of generated.output) {
    codeMap[chunk.fileName] = chunk.code;
  }
  return codeMap;
}

async function getCodeFromBundle(bundle, customOptions = {}) {
  const options = { exports: 'auto', format: 'cjs', ...customOptions };
  return (await bundle.generate(options)).output[0].code;
}

async function executeBundle(bundle, t, { context, exports } = {}) {
  const codeMap = await getCodeMapFromBundle(bundle, exports ? { exports } : {});
  return runCodeSplitTest(codeMap, t, context);
}

module.exports = {
  commonjs,
  executeBundle,
  getCodeFromBundle,
  getCodeMapFromBundle,
  runCodeSplitTest
};
