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

  let idx = 0;
  for (let i = 0; i < result.length; i++) {
    const match: RegExpMatchArray = [result[i]];
    match.index = idx;
    idx += result[i].length;
    output.push(match);
  }
  return output;
}

function findPositionToInsertShim(input: string, pattern: RegExp) {
  let lastImport;
  // mimicking behavior of `String.matchAll` as it returns an iterator, not an array
  for (const match of matchAllPolyfill(input, pattern)) {
    lastImport = match;
  }
  if (!lastImport) {
    return 0;
  }

  return (lastImport.index || 0) + lastImport[0].length;
}

export function provideCJSSyntax(code: string): Output | null {
  if (code.includes(ESMShim) || !CJSyntaxRegex.test(code)) {
    return null;
  }

  const indexToAppend = findPositionToInsertShim(code, ESMStaticImportRegex);
  const s = new MagicString(code);
  s.appendRight(indexToAppend, ESMShim);

  const sourceMap = s.generateMap({
    includeContent: true
  });
  let sourcesContent: string[] | undefined;
  if (Array.isArray(sourceMap.sourcesContent)) {
    sourcesContent = [];
    for (let i = 0; i < sourceMap.sourcesContent.length; i++) {
      const content = sourceMap.sourcesContent[i];
      if (typeof content === 'string') {
        sourcesContent.push(content);
      }
    }
  }

  return {
    code: s.toString(),
    map: {
      ...sourceMap,
      sourcesContent
    }
  };
}
