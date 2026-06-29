import type { Plugin, SourceMapInput } from 'rollup';

export interface Output {
  code: string;
  map?: SourceMapInput;
}

/**
 * A Rollup plugin to replace cjs syntax for esm output bundles.
 *
 * @returns Plugin instance.
 */
export function esmShim(): Plugin;
export default esmShim;
export function provideCJSSyntax(code: string): Output | null;
