import type { Plugin, FunctionPluginHooks } from 'rollup';
import type internalDel from 'del';

interface RollupDelOptions extends internalDel.Options {
  /**
   * Rollup hook the plugin should use.
   * @default 'buildStart'
   */
  readonly hook?: FunctionPluginHooks;

  /**
   * Delete items once. Useful in watch mode.
   * @default false
   */
  readonly runOnce?: boolean;

  /**
   * Patterns of files and folders to be deleted.
   * @default []
   */
  readonly targets?: string | ReadonlyArray<string>;

  /**
   * Outputs removed files and folders to console.
   * @default false
   */
  readonly verbose?: boolean;
}

/**
 * Delete files and folders.
 * @param options - RollupDelOptions.
 * @returns Plugin.
 */
export default function del(options?: RollupDelOptions): Plugin;
