import { Plugin } from 'rollup';

type Injectment = string | [string, string];

export interface RollupInjectOptions {
  /**
   * All other options are treated as `string: injectment` injectrs,
   * or `string: (id) => injectment` functions.
   */
  [str: string]: Injectment | RollupInjectOptions['include'] | RollupInjectOptions['modules'];

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
   * You can separate values to inject from other options.
   */
  modules?: { [str: string]: Injectment };
}

/**
 * inject strings in files while bundling them.
 */
export default function inject(options?: RollupInjectOptions): Plugin;
