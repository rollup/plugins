export function exactRegex(str: string, flags?: string): RegExp {
  return new RegExp(`^${escapeRegex(str)}$`, flags);
}

export function prefixRegex(str: string, flags?: string): RegExp {
  return new RegExp(`^${escapeRegex(str)}`, flags);
}

const escapeRegexRE = /[-/\\^$*+?.()|[\]{}]/g;
function escapeRegex(str: string): string {
  return str.replace(escapeRegexRE, '\\$&');
}
