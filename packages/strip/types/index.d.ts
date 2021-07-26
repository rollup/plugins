import { FilterPattern } from '@rollup/pluginutils';
import { Plugin } from 'rollup';

interface RollupStripOptions {
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
   * If `true` instructs the plugin to remove debugger statements.
   * @default true
   */
  debugger?: boolean;
  /**
   * Specifies the functions that the plugin will target and remove.
   *
   * _Note: specifying functions that are used at the begining of a chain, such as `a().b().c()`,
   * will result in `(void 0).b().c()` which will generate an error at runtime._
   * @default ['console.*', 'assert.*']
   */
  functions?: string[];
  /**
   * Specifies the [labeled blocks or statements](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/label)
   * that the plugin will target and remove.
   *
   * _Note: the `**:**` is implied and should not be specified in the config._
   * @default []
   */
  labels?: string[];
  /**
   * If `true`, instructs the plugin to update source maps accordingly after removing configured
   * targets from the bundle.
   * @default true
   */
  sourceMap?: boolean;
}

/**
 * A Rollup plugin to remove debugger statements and functions like `assert.equal` and
 * `console.log` from your code.
 */
export default function strip(options?: RollupStripOptions): Plugin;
