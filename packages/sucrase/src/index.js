const fs = require('fs');
const path = require('path');

const { transform } = require('sucrase');
const { createFilter } = require('@rollup/pluginutils');

module.exports = function sucrase(opts = {}) {
  const filter = createFilter(opts.include, opts.exclude);

  return {
    name: 'sucrase',

    // eslint-disable-next-line consistent-return
    resolveId(importee, importer) {
      if (importer && /^[./]/.test(importee)) {
        const resolved = path.resolve(importer ? path.dirname(importer) : process.cwd(), importee);
        // resolve in the same order that TypeScript resolves modules
        const resolvedFilename = [
          `${resolved}.ts`,
          `${resolved}.tsx`,
          `${resolved}/index.ts`,
          `${resolved}/index.tsx`
        ].find((filename) => fs.existsSync(filename));

        if (resolvedFilename) {
          return resolvedFilename;
        }
      }
    },

    transform(code, id) {
      if (!filter(id)) return null;

      const result = transform(code, {
        transforms: opts.transforms,
        jsxPragma: opts.jsxPragma,
        jsxFragmentPragma: opts.jsxFragmentPragma,
        enableLegacyTypeScriptModuleInterop: opts.enableLegacyTypeScriptModuleInterop,
        enableLegacyBabel5ModuleInterop: opts.enableLegacyBabel5ModuleInterop,
        production: opts.production,
        filePath: id,
        sourceMapOptions: {
          compiledFilename: id
        }
      });
      return {
        code: result.code,
        map: result.sourceMap
      };
    }
  };
};
