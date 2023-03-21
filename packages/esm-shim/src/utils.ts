import MagicString from 'magic-string';

// Shim __dirname, __filename and require
import { ESMShim, CJSyntaxRegex, ESMStaticImportRegex } from './constants';
import type { Output } from './types';

function matchAllPolyfill(input: string, pattern: string | RegExp): RegExpMatchArray[] {
  const regex = new RegExp(pattern, 'g');
  const output: RegExpMatchArray[] = [];

  const result = input.match(regex);
  if (!result) {
    return [];
  }

  for (let i = 0; i < result.length; i++) {
    output.push(result[i].match(new RegExp(pattern)) || []);
  }
  return output;
}

export function matchAll(regex: RegExp, input: string, addition: Record<string, any>) {
  const matches = [];
  for (const match of matchAllPolyfill(input, regex)) {
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
