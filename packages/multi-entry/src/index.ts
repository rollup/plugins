import virtual from '@rollup/plugin-virtual';
import { glob } from 'tinyglobby';

import type { Plugin } from 'rollup';

import type { RollupMultiEntryOptions } from '../types';

import { extractDirectories } from './utils';

const DEFAULT_OUTPUT = 'multi-entry.js';
const AS_IMPORT = 'import';
const AS_EXPORT = 'export * from';

export default function multiEntry(config: RollupMultiEntryOptions = {}): Plugin {
  let entryFileName = config.entryFileName ?? DEFAULT_OUTPUT;
  let include: string[] = [];
  let exclude: string[] = [];
  let exports = config.exports ?? true;

  const exporter = (path: string) => `${exports ? AS_EXPORT : AS_IMPORT} ${JSON.stringify(path)}`;

  let virtualisedEntry: {
    resolveId(id: string, importer?: string): string | null;
    load(id: string): string | null;
  };

  return {
    name: 'multi-entry',

    options(options) {
      if (options.input !== entryFileName) {
        if (typeof options.input === 'string') {
          include = [options.input];
        } else if (Array.isArray(options.input)) {
          include = options.input;
        } else if (options.input) {
          // Consider options.input as a configuration object for this plugin instead
          // of an `{ [entryAlias: string]: string; }` map object
          const input = options.input as RollupMultiEntryOptions;
          entryFileName = input.entryFileName ?? DEFAULT_OUTPUT;
          include = typeof input.include === 'string' ? [input.include] : input.include ?? [];
          exclude = typeof input.exclude === 'string' ? [input.exclude] : input.exclude ?? [];
          exports = input.exports ?? true;
        }
      }

      return {
        ...options,
        input: entryFileName
      };
    },

    outputOptions(options) {
      return {
        ...options,
        entryFileNames: config.preserveModules ? options.entryFileNames : entryFileName
      };
    },

    async buildStart(options) {
      const patterns = include.concat(exclude.map((pattern) => `!${pattern}`));
      const entries = patterns.length
        ? glob(patterns, { absolute: true })
            .then((paths) => paths.sort())
            .then((paths) => paths.map(exporter).join('\n'))
        : Promise.resolve('');
      virtualisedEntry = virtual({ [options.input as unknown as string]: await entries }) as any;

      if (this.meta.watchMode) {
        for (const dir of extractDirectories(patterns)) this.addWatchFile(dir);
      }
    },

    resolveId(id, importer) {
      return virtualisedEntry && virtualisedEntry.resolveId(id, importer);
    },

    load(id) {
      return virtualisedEntry && virtualisedEntry.load(id);
    }
  };
}
