import { PartialResolvedId, Plugin } from 'rollup';

import { Alias, ResolverFunction, RollupAliasOptions } from '../types';

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
  return id;
}

function getEntries({ entries }: RollupAliasOptions): readonly Alias[] {
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

function getCustomResolver(
  { customResolver }: Alias,
  options: RollupAliasOptions
): ResolverFunction | null {
  if (typeof customResolver === 'function') {
    return customResolver;
  }
  if (customResolver && typeof customResolver.resolveId === 'function') {
    return customResolver.resolveId;
  }
  if (typeof options.customResolver === 'function') {
    return options.customResolver;
  }
  if (options.customResolver && typeof options.customResolver.resolveId === 'function') {
    return options.customResolver.resolveId;
  }
  return null;
}

export default function alias(options: RollupAliasOptions = {}): Plugin {
  const entries = getEntries(options);

  if (entries.length === 0) {
    return {
      name: 'alias',
      resolveId: noop
    };
  }

  return {
    name: 'alias',
    buildStart(inputOptions) {
      return Promise.all(
        [...entries, options].map(
          ({ customResolver }) =>
            customResolver &&
            typeof customResolver === 'object' &&
            typeof customResolver.buildStart === 'function' &&
            customResolver.buildStart.call(this, inputOptions)
        )
      ).then(() => {
        // enforce void return value
      });
    },
    resolveId(importee, importer, resolveOptions) {
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

      const customResolver = getCustomResolver(matchedEntry, options);
      if (customResolver) {
        return customResolver.call(this, updatedId, importerId, resolveOptions);
      }

      return this.resolve(
        updatedId,
        importer,
        Object.assign({ skipSelf: true }, resolveOptions)
      ).then((resolved) => {
        let finalResult: PartialResolvedId | null = resolved;
        if (!finalResult) {
          finalResult = { id: updatedId };
        }

        return finalResult;
      });
    }
  };
}
