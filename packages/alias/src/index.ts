import { platform } from 'os';

import { PartialResolvedId, Plugin } from 'rollup';
import slash from 'slash';

import { Alias, ResolverFunction, RollupAliasOptions } from '../types';

const VOLUME = /^([A-Z]:)/i;
const IS_WINDOWS = platform() === 'win32';

// Helper functions
const noop = () => null;
function matches(pattern: string | RegExp, importee: string) {
  if (pattern instanceof RegExp) {
    return pattern.test(importee);
  }
  if (importee.length < pattern.length) {
    return false;
  }
  if (importee === pattern) {
    return true;
  }
  const importeeStartsWithKey = importee.indexOf(pattern) === 0;
  const importeeHasSlashAfterKey = importee.substring(pattern.length)[0] === '/';
  return importeeStartsWithKey && importeeHasSlashAfterKey;
}

function normalizeId(id: string): string;
function normalizeId(id: string | undefined): string | undefined;
function normalizeId(id: string | undefined) {
  if (typeof id === 'string' && (IS_WINDOWS || VOLUME.test(id))) {
    return slash(id.replace(VOLUME, ''));
  }
  return id;
}

function getEntries({ entries }: RollupAliasOptions): Alias[] {
  if (!entries) {
    return [];
  }

  if (Array.isArray(entries)) {
    return entries;
  }

  return Object.entries(entries).map(([key, value]) => {
    return { find: key, replacement: value };
  });
}

export default function alias(options: RollupAliasOptions = {}): Plugin {
  const entries = getEntries(options);

  // No aliases?
  if (entries.length === 0) {
    return {
      name: 'alias',
      resolveId: noop
    };
  }

  return {
    name: 'alias',
    resolveId(importee, importer) {
      const importeeId = normalizeId(importee);
      const importerId = normalizeId(importer);

      // First match is supposed to be the correct one
      const matchedEntry = entries.find((entry) => matches(entry.find, importeeId));
      if (!matchedEntry || !importerId) {
        return null;
      }

      const updatedId = normalizeId(
        importeeId.replace(matchedEntry.find, matchedEntry.replacement)
      );

      let customResolver: ResolverFunction | null = null;
      if (typeof matchedEntry.customResolver === 'function') {
        ({ customResolver } = matchedEntry);
      } else if (
        typeof matchedEntry.customResolver === 'object' &&
        typeof matchedEntry.customResolver!.resolveId === 'function'
      ) {
        customResolver = matchedEntry.customResolver!.resolveId;
      } else if (typeof options.customResolver === 'function') {
        ({ customResolver } = options);
      } else if (
        typeof options.customResolver === 'object' &&
        typeof options.customResolver!.resolveId === 'function'
      ) {
        customResolver = options.customResolver!.resolveId;
      }

      if (customResolver) {
        return customResolver(updatedId, importerId);
      }

      return this.resolve(updatedId, importer, { skipSelf: true }).then((resolved) => {
        let finalResult: PartialResolvedId | null = resolved;
        if (!finalResult) {
          finalResult = { id: updatedId };
        }

        return finalResult;
      });
    }
  };
}
