import { FilterPattern } from '@rollup/pluginutils';
import { walk } from 'estree-walker';
import { Plugin } from 'rollup';

interface RollupDynamicImportVariablesOptions {
  /**
   * A minimatch pattern, or array of patterns, which specifies the files in the build the plugin
   * should operate on.
   * By default all files are targeted.
   */
  include?: FilterPattern;
  /**
   * A minimatch pattern, or array of patterns, which specifies the files in the build the plugin
   * should _ignore_.
   * By default no files are ignored.
   */
  exclude?: FilterPattern;
  /**
   * By default, the plugin quits the build process when it encounters an error.
   * If you set this option to true, it will throw a warning instead and leave the code untouched.
   * @default false
   */
  warnOnError?: boolean;
}

export class VariableDynamicImportError extends Error {}

export function dynamicImportToGlob(...params: Parameters<typeof walk>): null | string;

/**
 * Support variables in dynamic imports in Rollup.
 */
export default function dynamicImportVariables(
  options?: RollupDynamicImportVariablesOptions
): Plugin;
