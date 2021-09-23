import { Plugin } from 'rollup';

import { ResolvedAlias, ResolverFunction, ResolverObject, RollupAliasOptions } from '../types';

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
  // eslint-disable-next-line prefer-template
  return importee.startsWith(pattern + '/');
}

function getEntries({ entries, customResolver }: RollupAliasOptions): readonly ResolvedAlias[] {
  if (!entries) {
    return [];
  }

  const customResolverFromOptions = resolveCustomResolver(customResolver);

  if (Array.isArray(entries)) {
    return entries.map((entry) => {
      return {
        find: entry.find,
        replacement: entry.replacement,
        customResolver: resolveCustomResolver(entry.customResolver) || customResolverFromOptions
      };
    });
  }

  return Object.entries(entries).map(([key, value]) => {
    return { find: key, replacement: value, customResolver: customResolverFromOptions };
  });
}

function resolveCustomResolver(
  customResolver: ResolverFunction | ResolverObject | null | undefined
): ResolverFunction | null {
  if (customResolver) {
    if (typeof customResolver === 'function') {
      return customResolver;
    }
    if (typeof customResolver.resolveId === 'function') {
      return customResolver.resolveId;
    }
  }
  return null;
}

export default function alias(options: RollupAliasOptions = {}): Plugin {
  const entries = getEntries(options);

  if (entries.length === 0) {
    return {
      name: 'alias',
      resolveId: () => null
    };
  }

  return {
    name: 'alias',
    async buildStart(inputOptions) {
      await Promise.all(
        [...entries, options].map(
          ({ customResolver }) =>
            customResolver &&
            typeof customResolver === 'object' &&
            typeof customResolver.buildStart === 'function' &&
            customResolver.buildStart.call(this, inputOptions)
        )
      );
    },
    resolveId(importee, importer) {
      if (!importer) {
        return null;
      }
      // First match is supposed to be the correct one
      const matchedEntry = entries.find((entry) => matches(entry.find, importee));
      if (!matchedEntry) {
        return null;
      }

      const updatedId = importee.replace(matchedEntry.find, matchedEntry.replacement);

      if (matchedEntry.customResolver) {
        return matchedEntry.customResolver.call(this, updatedId, importer, {});
      }

      return this.resolve(updatedId, importer, { skipSelf: true }).then(
        (resolved) => resolved || { id: updatedId }
      );
    }
  };
}
