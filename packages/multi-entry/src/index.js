/* eslint-disable no-param-reassign */

import virtual from '@rollup/plugin-virtual';
import { promise as matched } from 'matched';

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
        entryFileNames: config.entryFileName
      };
    },

    buildStart(options) {
      const patterns = config.include.concat(config.exclude.map((pattern) => `!${pattern}`));
      const entries = patterns.length
        ? matched(patterns, { realpath: true }).then((paths) => paths.map(exporter).join('\n'))
        : Promise.resolve('');

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
