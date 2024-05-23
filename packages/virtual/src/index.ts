import * as path from 'path';

import type { Plugin } from 'rollup';

import type { RollupVirtualOptions, RollupVirtualOption } from '../';

const PREFIX = `\0virtual:`;
const IMPORTER_SEP = `::`;

export default function virtual(modules: RollupVirtualOptions): Plugin {
  const resolvedIds = new Map<string, RollupVirtualOption>();

  Object.keys(modules).forEach((id) => {
    resolvedIds.set(path.resolve(id), modules[id]);
  });

  return {
    name: 'virtual',

    resolveId(id, importer) {
      const importerSuffix = importer ? `${IMPORTER_SEP}${importer}` : '';

      if (id in modules) return PREFIX + id + importerSuffix;

      if (importer) {
        const importerNoPrefix = importer.startsWith(PREFIX)
          ? importer.slice(PREFIX.length)
          : importer;
        const resolved = path.resolve(path.dirname(importerNoPrefix), id);
        if (resolvedIds.has(resolved)) return PREFIX + resolved + importerSuffix;
      }

      return null;
    },

    load(id) {
      if (id.startsWith(PREFIX)) {
        const [idNoPrefix, importer] = id.slice(PREFIX.length).split(IMPORTER_SEP);

        const module = idNoPrefix in modules ? modules[idNoPrefix] : resolvedIds.get(idNoPrefix);

        if (typeof module === 'function') {
          return module(importer);
        }

        return module;
      }

      return null;
    }
  };
}
