import { Plugin } from 'rollup';

import type { ResolvedAlias, ResolverFunction, ResolverObject, RollupAliasOptions } from '../types';

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

  const resolverFunctionFromOptions = resolveCustomResolver(customResolver);

  if (Array.isArray(entries)) {
    return entries.map((entry) => {
      return {
        find: entry.find,
        replacement: entry.replacement,
        resolverFunction: resolveCustomResolver(entry.customResolver) || resolverFunctionFromOptions
      };
    });
  }

  return Object.entries(entries).map(([key, value]) => {
    return { find: key, replacement: value, resolverFunction: resolverFunctionFromOptions };
  });
}

function getHookFunction<T extends Function>(hook: T | { handler?: T }): T | null {
  if (typeof hook === 'function') {
    return hook;
  }
  if (hook && 'handler' in hook && typeof hook.handler === 'function') {
    return hook.handler;
  }
  return null;
}

function resolveCustomResolver(
  customResolver: ResolverFunction | ResolverObject | null | undefined
): ResolverFunction | null {
  if (typeof customResolver === 'function') {
    return customResolver;
  }
  if (customResolver) {
    return getHookFunction(customResolver.resolveId);
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
        [...(Array.isArray(options.entries) ? options.entries : []), options].map(
          ({ customResolver }) =>
            customResolver && getHookFunction(customResolver.buildStart)?.call(this, inputOptions)
        )
      );
    },
    resolveId(importee, importer, resolveOptions) {
      if (!importer) {
        return null;
      }
      // First match is supposed to be the correct one
      const matchedEntry = entries.find((entry) => matches(entry.find, importee));
      if (!matchedEntry) {
        return null;
      }

      const updatedId = importee.replace(matchedEntry.find, matchedEntry.replacement);

      if (matchedEntry.resolverFunction) {
        return matchedEntry.resolverFunction.call(this, updatedId, importer, resolveOptions);
      }

      return this.resolve(
        updatedId,
        importer,
        Object.assign({ skipSelf: true }, resolveOptions)
      ).then((resolved) => resolved || { id: updatedId });
    }
  };
}
