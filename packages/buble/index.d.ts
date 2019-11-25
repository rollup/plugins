import { Plugin } from 'rollup';
import { TransformOptions } from 'buble';

export interface RollupBubleOptions extends TransformOptions {
  /**
   * A minimatch pattern, or array of patterns, of files that should be
   * processed by this plugin (if omitted, all files are included by default)
   */
  include?: string | RegExp | ReadonlyArray<string | RegExp> | null;
  /**
   * Files that should be excluded, if `include` is otherwise too permissive.
   */
  exclude?: string | RegExp | ReadonlyArray<string | RegExp> | null;
}

/**
 * Convert ES2015 with buble.
 */
export default function buble(options?: RollupBubleOptions): Plugin;
