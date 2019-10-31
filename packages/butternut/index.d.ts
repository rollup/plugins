import { Plugin } from 'rollup';

interface ButternutOptions {
  check?: boolean;
  allowDangerousEval?: boolean;
  sourceMap?: boolean;
  file?: string;
  source?: string;
  includeContent? : boolean;
}


interface RollupButternutOptions {
  /**
   * A minimatch pattern, or array of patterns, of files that should be
   * processed by this plugin (if omitted, all files are included by default)
   */
  include?: string | RegExp | ReadonlyArray<string | RegExp> | null;
  /**
   * Files that should be excluded, if `include` is otherwise too permissive.
   */
  exclude?: string | RegExp | ReadonlyArray<string | RegExp> | null;
  /**
   * Buble TransformOptions
   */
  transforms?: ButternutOptions;
}

/**
 * Convert ES2015 with buble.
 */
export default function butternut(options?: RollupButternutOptions): Plugin;
