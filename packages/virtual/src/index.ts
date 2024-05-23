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

  function getImporterSuffix(id: string, importer: string | undefined) {
    const module = modules[id] ?? resolvedIds.get(id);
    if (typeof module === 'function') {
      const importerSuffix = importer ? `${IMPORTER_SEP}${importer}` : '';
      return importerSuffix;
    }

    return '';
  }

  return {
    name: 'virtual',

    resolveId(id, importer) {
      if (id in modules) return PREFIX + id + getImporterSuffix(id, importer);

      if (importer) {
        const importerNoPrefix = importer.startsWith(PREFIX)
          ? importer.slice(PREFIX.length)
          : importer;
        const resolved = path.resolve(path.dirname(importerNoPrefix), id);
        if (resolvedIds.has(resolved))
          return PREFIX + resolved + getImporterSuffix(resolved, importer);
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
