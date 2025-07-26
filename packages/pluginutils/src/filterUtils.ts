export function exactRegex(str: string | string[], flags?: string): RegExp {
  return new RegExp(`^${combineMultipleStrings(str)}$`, flags);
}

export function prefixRegex(str: string | string[], flags?: string): RegExp {
  return new RegExp(`^${combineMultipleStrings(str)}`, flags);
}

export function suffixRegex(str: string | string[], flags?: string): RegExp {
  return new RegExp(`${combineMultipleStrings(str)}$`, flags);
}

const escapeRegexRE = /[-/\\^$*+?.()|[\]{}]/g;
function escapeRegex(str: string): string {
  return str.replace(escapeRegexRE, '\\$&');
}
function combineMultipleStrings(str: string | string[]): string {
  if (Array.isArray(str)) {
    const escapeStr = str.map(escapeRegex).join('|');
    if (escapeStr && str.length > 1) {
      return `(?:${escapeStr})`;
    }
    return escapeStr;
  }
  return escapeRegex(str);
}
