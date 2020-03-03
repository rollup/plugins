import { FilterPattern } from '@rollup/pluginutils';
import { Plugin } from 'rollup';

export interface RollupMultiEntryOptions {
  /**
   * A minimatch pattern, or array of patterns, of files that should be
   * processed by this plugin (if omitted, all files are included by default)
   */
  include?: FilterPattern;
  /**
   * Files that should be excluded, if `include` is otherwise too permissive.
   */
  exclude?: FilterPattern;
  /**
   * If `true`, instructs the plugin to export named exports to the bundle from all entries.
   * If `false`, the plugin will not export any entry exports to the bundle.
   * This can be useful when wanting to combine code from multiple entry files,
   * but not necessarily to export each entry file's exports.
   * @default true
   */
  exports?: boolean;
}

/**
 * Allows use of multiple entry points for a bundle
 */
export default function multiEntry(options?: RollupMultiEntryOptions): Plugin;
