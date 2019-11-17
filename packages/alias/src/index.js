import { platform } from 'os';

import slash from 'slash';

const VOLUME = /^([A-Z]:)/i;
const IS_WINDOWS = platform() === 'win32';

// Helper functions
const noop = () => null;
const matches = (pattern, importee) => {
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
};

const normalizeId = (id) => {
  if ((IS_WINDOWS && typeof id === 'string') || VOLUME.test(id)) {
    return slash(id.replace(VOLUME, ''));
  }
  return id;
};

const getEntries = ({ entries }) => {
  if (!entries) {
    return [];
  }

  if (Array.isArray(entries)) {
    return entries;
  }

  return Object.keys(entries).map((key) => {
    return { find: key, replacement: entries[key] };
  });
};

export default function alias(options = {}) {
  const entries = getEntries(options);

  // No aliases?
  if (entries.length === 0) {
    return {
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

      let customResolver = null;
      if (typeof matchedEntry.customResolver === 'function') {
        ({ customResolver } = matchedEntry);
      } else if (
        typeof matchedEntry.customResolver === 'object' &&
        typeof matchedEntry.customResolver.resolveId === 'function'
      ) {
        customResolver = matchedEntry.customResolver.resolveId;
      } else if (typeof options.customResolver === 'function') {
        ({ customResolver } = options);
      } else if (
        typeof options.customResolver === 'object' &&
        typeof options.customResolver.resolveId === 'function'
      ) {
        customResolver = options.customResolver.resolveId;
      }

      if (customResolver) {
        return customResolver(updatedId, importerId);
      }

      return this.resolve(updatedId, importer, { skipSelf: true }).then((resolved) => {
        let finalResult = resolved;
        if (!finalResult) {
          finalResult = { id: updatedId };
        }

        return finalResult;
      });
    }
  };
}
