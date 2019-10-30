import fs from 'fs';
import { platform } from 'os';
import path, { posix } from 'path';

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
const endsWith = (needle, haystack) => haystack.slice(-needle.length) === needle;
const isFilePath = (id) => /^\.?\//.test(id);
const exists = (uri) => {
  try {
    return fs.statSync(uri).isFile();
  } catch (e) {
    return false;
  }
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
  const resolve = Array.isArray(options.resolve) ? options.resolve : ['.js'];
  const entries = getEntries(options);

  // No aliases?
  if (entries.length === 0) {
    return {
      resolveId: noop
    };
  }

  return {
    resolveId(importee, importer) {
      const importeeId = normalizeId(importee);
      const importerId = normalizeId(importer);

      // First match is supposed to be the correct one
      const matchedEntry = entries.find((entry) => matches(entry.find, importeeId));
      if (!matchedEntry || !importerId) {
        return null;
      }

      let updatedId = normalizeId(importeeId.replace(matchedEntry.find, matchedEntry.replacement));

      if (isFilePath(updatedId)) {
        const directory = posix.dirname(importerId);

        // Resolve file names
        const filePath = posix.resolve(directory, updatedId);
        const match = resolve
          .map((ext) => (endsWith(ext, filePath) ? filePath : `${filePath}${ext}`))
          .find(exists);

        if (match) {
          updatedId = match;
          // To keep the previous behaviour we simply return the file path
          // with extension
        } else if (endsWith('.js', filePath)) {
          updatedId = filePath;
        } else {
          const indexFilePath = posix.resolve(directory, `${updatedId}/index`);
          const defaultMatch = resolve.map((ext) => `${indexFilePath}${ext}`).find(exists);
          if (defaultMatch) {
            updatedId = defaultMatch;
          } else {
            updatedId = `${filePath}.js`;
          }
        }
      }

      // if alias is windows absoulate path return resolved path or
      // rollup on windows will throw:
      //  [TypeError: Cannot read property 'specifier' of undefined]
      if (VOLUME.test(matchedEntry.replacement)) {
        return path.resolve(updatedId);
      }
      return updatedId;
    }
  };
}
