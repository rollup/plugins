import type { Plugin, SourceMapInput } from 'rollup';

interface Output {
  code: string;
  map?: SourceMapInput;
}

export function provideCJSSyntax(code: string): Output | null;

/**
 * A Rollup plugin to replace cjs syntax for esm output bundles.
 *
 * @returns Plugin instance.
 */
declare function esShim(): Plugin;
export { esShim, esShim as default };
