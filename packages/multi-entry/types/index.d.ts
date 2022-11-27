import type { FilterPattern } from '@rollup/pluginutils';
import type { Plugin } from 'rollup';

interface RollupMultiEntryOptions {
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
   * - If `true`, instructs the plugin to export named exports to the bundle from all entries.
   * - If `false`, the plugin will not export any entry exports to the bundle.
   * @default true
   */
  exports?: boolean;
  /**
   * `entryFileName` changes the name of the generated entry file.
   * By default, it will override `outputOptions.entryFileNames` to be `'multi-entry.js'`.
   * @default 'multi-entry.js'
   */
  entryFileName?: string;
  /**
   * The preserveModules option is to be used in conjunction with output.preserveModules ({@link https://rollupjs.org/guide/en/#outputpreservemodules}).
   * If `true`, overrides the `entryFileName` option to be output.entryFileNames.
   * If `false`, the plugin will respect the `entryFileName` option.
   * @default false
   */
  preserveModules?: boolean;
}

/**
 * A Rollup plugin which allows use of multiple entry points for a bundle.
 *
 * _Note: `default` exports cannot be combined and exported by this plugin. Only named exports
 * will be exported._
 */
export default function multiEntry(options?: RollupMultiEntryOptions): Plugin;
