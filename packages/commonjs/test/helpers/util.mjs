import { createRequire } from 'module';
import * as path from 'path';

import commonjsPlugin from 'current-package';

const require = createRequire(import.meta.url);

export function commonjs(options) {
  return commonjsPlugin(options);
}

export function normalizePathSlashes(path) {
  return path.replace(/\\/g, '/');
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

export function runCodeSplitTest(codeMap, t, entryName = 'main.js', configContext = {}) {
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
      require: requireFromOutputVia(entryName),
      ...context
    });
  } catch (error) {
    return { error, exports: error.exports };
  }
  return { exports, global };
}

export async function getCodeMapFromBundle(bundle, options = {}) {
  const generated = await bundle.generate({
    interop: 'compat',
    exports: 'auto',
    format: 'cjs',
    ...options
  });
  const codeMap = {};
  for (const chunk of generated.output) {
    codeMap[chunk.fileName] = chunk.code;
  }
  return codeMap;
}

export async function getCodeFromBundle(bundle, customOptions = {}) {
  const options = { exports: 'auto', format: 'cjs', ...customOptions };
  return (await bundle.generate(options)).output[0].code;
}

export async function executeBundle(bundle, t, { context, exports, testEntry = 'main.js' } = {}) {
  const codeMap = await getCodeMapFromBundle(bundle, exports ? { exports } : {});
  return runCodeSplitTest(codeMap, t, testEntry, context);
}
