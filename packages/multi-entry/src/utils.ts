/* eslint-disable no-irregular-whitespace, no-continue */
import { isDynamicPattern } from 'tinyglobby';

/**
 * Transforms an array of patterns into an array of static directories.
 *
 * @example
 *   ["./src​/**​/*.js"] -> ["./src"]
 *   ["./{lib,utils}/index.js"] -> ["."]
 */
export function extractDirectories(patterns: string[]): string[] {
  const directories = new Set<string>();

  for (const pattern of patterns) {
    // Skip negated patterns
    if (pattern.startsWith('!')) continue;

    const parts = pattern.split(/\/|\\/g);
    let [dir] = parts;

    // If the pattern is dynamic from the beginning, skip it
    if (isDynamicPattern(dir)) continue;

    // Join all the parts until the pattern is dynamic
    for (const part of parts.slice(1)) {
      const newDir = `${dir}/${part}`;
      if (isDynamicPattern(newDir)) {
        directories.add(dir);
        break;
      }
      dir = newDir;
    }
    directories.add(dir);
  }

  return [...directories];
}
