import type { FilterPattern } from '@rollup/pluginutils';
import type { TransformOptions } from 'buble';
import type { Plugin } from 'rollup';

export interface RollupBubleOptions extends TransformOptions {
  /**
   * A picomatch pattern, or array of patterns, of files that should be
   * processed by this plugin (if omitted, all files are included by default)
   */
  include?: FilterPattern;
  /**
   * Files that should be excluded, if `include` is otherwise too permissive.
   */
  exclude?: FilterPattern;
}

/**
 * Convert ES2015 with buble.
 */
export default function buble(options?: RollupBubleOptions): Plugin;
