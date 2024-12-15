import type { DataToEsm } from '../types';

import makeLegalIdentifier from './makeLegalIdentifier';

export type Indent = string | null | undefined;

function stringify(obj: unknown): string {
  return (JSON.stringify(obj) || 'undefined').replace(
    /[\u2028\u2029]/g,
    (char) => `\\u${`000${char.charCodeAt(0).toString(16)}`.slice(-4)}`
  );
}

function serializeArray<T>(arr: T[], indent: Indent, baseIndent: string): string {
  let output = '[';
  const separator = indent ? `\n${baseIndent}${indent}` : '';
  for (let i = 0; i < arr.length; i++) {
    const key = arr[i];
    output += `${i > 0 ? ',' : ''}${separator}${serialize(key, indent, baseIndent + indent)}`;
  }
  return `${output}${indent ? `\n${baseIndent}` : ''}]`;
}

function serializeObject(obj: object, indent: Indent, baseIndent: string): string {
  let output = '{';
  const separator = indent ? `\n${baseIndent}${indent}` : '';
  const entries = Object.entries(obj);
  for (let i = 0; i < entries.length; i++) {
    const [key, value] = entries[i];
    const stringKey = makeLegalIdentifier(key) === key ? key : stringify(key);
    output += `${i > 0 ? ',' : ''}${separator}${stringKey}:${indent ? ' ' : ''}${serialize(
      value,
      indent,
      baseIndent + indent
    )}`;
  }
  return `${output}${indent ? `\n${baseIndent}` : ''}}`;
}

function serialize(obj: unknown, indent: Indent, baseIndent: string): string {
  if (typeof obj === 'object' && obj !== null) {
    if (Array.isArray(obj)) return serializeArray(obj, indent, baseIndent);
    if (obj instanceof Date) return `new Date(${obj.getTime()})`;
    if (obj instanceof RegExp) return obj.toString();
    return serializeObject(obj, indent, baseIndent);
  }
  if (typeof obj === 'number') {
    if (obj === Infinity) return 'Infinity';
    if (obj === -Infinity) return '-Infinity';
    if (obj === 0) return 1 / obj === Infinity ? '0' : '-0';
    if (obj !== obj) return 'NaN'; // eslint-disable-line no-self-compare
  }
  if (typeof obj === 'symbol') {
    const key = Symbol.keyFor(obj);
    // eslint-disable-next-line no-undefined
    if (key !== undefined) return `Symbol.for(${stringify(key)})`;
  }
  if (typeof obj === 'bigint') return `${obj}n`;
  return stringify(obj);
}

// isWellFormed exists from Node.js 20
const hasStringIsWellFormed = 'isWellFormed' in String.prototype;

function isWellFormedString(input: string): boolean {
  // @ts-expect-error String::isWellFormed exists from ES2024. tsconfig lib is set to ES6
  if (hasStringIsWellFormed) return input.isWellFormed();

  // https://github.com/tc39/proposal-is-usv-string/blob/main/README.md#algorithm
  return !/\p{Surrogate}/u.test(input);
}

const dataToEsm: DataToEsm = function dataToEsm(data, options = {}) {
  const t = options.compact ? '' : 'indent' in options ? options.indent : '\t';
  const _ = options.compact ? '' : ' ';
  const n = options.compact ? '' : '\n';
  const declarationType = options.preferConst ? 'const' : 'var';

  if (
    options.namedExports === false ||
    typeof data !== 'object' ||
    Array.isArray(data) ||
    data instanceof Date ||
    data instanceof RegExp ||
    data === null
  ) {
    const code = serialize(data, options.compact ? null : t, '');
    const magic = _ || (/^[{[\-\/]/.test(code) ? '' : ' '); // eslint-disable-line no-useless-escape
    return `export default${magic}${code};`;
  }

  let maxUnderbarPrefixLength = 0;
  for (const key of Object.keys(data)) {
    const underbarPrefixLength = /^(_+)/.exec(key)?.[0].length ?? 0;
    if (underbarPrefixLength > maxUnderbarPrefixLength) {
      maxUnderbarPrefixLength = underbarPrefixLength;
    }
  }

  const arbitraryNamePrefix = `${'_'.repeat(maxUnderbarPrefixLength + 1)}arbitrary`;

  let namedExportCode = '';
  const defaultExportRows = [];
  const arbitraryNameExportRows: string[] = [];
  for (const [key, value] of Object.entries(data)) {
    if (key === makeLegalIdentifier(key)) {
      if (options.objectShorthand) defaultExportRows.push(key);
      else defaultExportRows.push(`${key}:${_}${key}`);
      namedExportCode += `export ${declarationType} ${key}${_}=${_}${serialize(
        value,
        options.compact ? null : t,
        ''
      )};${n}`;
    } else {
      defaultExportRows.push(
        `${stringify(key)}:${_}${serialize(value, options.compact ? null : t, '')}`
      );
      if (options.includeArbitraryNames && isWellFormedString(key)) {
        const variableName = `${arbitraryNamePrefix}${arbitraryNameExportRows.length}`;
        namedExportCode += `${declarationType} ${variableName}${_}=${_}${serialize(
          value,
          options.compact ? null : t,
          ''
        )};${n}`;
        arbitraryNameExportRows.push(`${variableName} as ${JSON.stringify(key)}`);
      }
    }
  }

  const arbitraryExportCode =
    arbitraryNameExportRows.length > 0
      ? `export${_}{${n}${t}${arbitraryNameExportRows.join(`,${n}${t}`)}${n}};${n}`
      : '';
  const defaultExportCode = `export default${_}{${n}${t}${defaultExportRows.join(
    `,${n}${t}`
  )}${n}};${n}`;

  return `${namedExportCode}${arbitraryExportCode}${defaultExportCode}`;
};

export { dataToEsm as default };
