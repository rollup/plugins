import MagicString from 'magic-string';

// Shim __dirname, __filename and require
import { ESMShim, CJSyntaxRegex, ESMStaticImportRegex } from './constants';
import type { Output } from './types';

export function matchAll(regex: RegExp, input: string, addition: Record<string, any>) {
  const matches = [];
  for (const match of input.matchAll(regex)) {
    matches.push({
      ...addition,
      ...match.groups,
      code: match[0],
      start: match.index,
      end: (match.index || 0) + match[0].length
    });
  }
  return matches;
}

export function provideCJSSyntax(code: string): Output | null {
  if (code.includes(ESMShim) || !CJSyntaxRegex.test(code)) {
    return null;
  }

  const lastESMImport = matchAll(ESMStaticImportRegex, code, { type: 'static' }).pop();
  const indexToAppend = lastESMImport ? lastESMImport.end : 0;
  const s = new MagicString(code);
  s.appendRight(indexToAppend, ESMShim);

  return {
    code: s.toString(),
    map: s.generateMap()
  };
}
