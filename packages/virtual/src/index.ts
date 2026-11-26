import * as path from 'path';

import type { Plugin } from 'rollup';

import type { RollupVirtualOptions } from '../types';

const PREFIX = `\0virtual:`;

export default function virtual(modules: RollupVirtualOptions): Plugin {
  const resolvedIds = new Map<string, string>();

  Object.keys(modules).forEach((id) => {
    resolvedIds.set(path.resolve(id), modules[id]);
  });

  return {
    name: 'virtual',

    resolveId(
      id,
      importer,
      resolveOptions?: { importerRawId?: string; attributes?: Record<string, string> }
    ) {
      if (id in modules) return PREFIX + id;

      if (importer) {
        const rawImporter = (resolveOptions && resolveOptions.importerRawId) || importer;
        const importerNoPrefix = rawImporter.startsWith(PREFIX)
          ? rawImporter.slice(PREFIX.length)
          : rawImporter;
        const resolved = path.resolve(path.dirname(importerNoPrefix), id);
        if (resolvedIds.has(resolved)) return PREFIX + resolved;
      }

      return null;
    },

    load(id, loadOptions?: { rawId?: string; attributes?: Record<string, string> }) {
      const rawId = (loadOptions && loadOptions.rawId) || id;
      if (rawId.startsWith(PREFIX)) {
        const idNoPrefix = rawId.slice(PREFIX.length);

        return idNoPrefix in modules ? modules[idNoPrefix] : resolvedIds.get(idNoPrefix);
      }

      return null;
    }
  };
}
