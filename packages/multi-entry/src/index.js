/* eslint-disable no-param-reassign */

import virtual from '@rollup/plugin-virtual';
import { glob } from 'glob';

const DEFAULT_OUTPUT = 'multi-entry.js';
const AS_IMPORT = 'import';
const AS_EXPORT = 'export * from';

export default function multiEntry(conf = {}) {
  const config = {
    include: [],
    exclude: [],
    entryFileName: DEFAULT_OUTPUT,
    exports: true,
    ...conf
  };

  let prefix = config.exports === false ? AS_IMPORT : AS_EXPORT;
  const exporter = (path) => `${prefix} ${JSON.stringify(path)}`;

  const configure = (input) => {
    if (typeof input === 'string') {
      config.include = [input];
    } else if (Array.isArray(input)) {
      config.include = input;
    } else {
      const { include = [], exclude = [], entryFileName = DEFAULT_OUTPUT, exports } = input;
      config.include = include;
      config.exclude = exclude;
      config.entryFileName = entryFileName;
      if (exports === false) {
        prefix = AS_IMPORT;
      }
    }
  };

  let virtualisedEntry;

  return {
    name: 'multi-entry',

    options(options) {
      if (options.input !== config.entryFileName) {
        configure(options.input);
      }
      return {
        ...options,
        input: config.entryFileName
      };
    },

    outputOptions(options) {
      return {
        ...options,
        entryFileNames: config.preserveModules ? options.entryFileNames : config.entryFileName
      };
    },

    async buildStart(options) {
      const patterns = config.include.concat(config.exclude.map((pattern) => `!${pattern}`));

      // Split patterns based on includes and excludes
      const includePatterns = patterns.filter((pattern) => !pattern.startsWith('!'));
      const excludePatterns = patterns
        .filter((pattern) => pattern.startsWith('!'))
        .map((pattern) => pattern.substring(1));

      const paths = await Promise.all(
        includePatterns.map(async (pattern) =>
          glob(pattern, {
            absolute: true,
            ignore: excludePatterns
          })
        )
      );

      const flatPaths = [...new Set(paths.flat())];

      const entries = flatPaths.length ? flatPaths.map(exporter).join('\n') : '';

      virtualisedEntry = virtual({ [options.input]: entries });
    },

    resolveId(id, importer) {
      return virtualisedEntry && virtualisedEntry.resolveId(id, importer);
    },

    load(id) {
      return virtualisedEntry && virtualisedEntry.load(id);
    }
  };
}
