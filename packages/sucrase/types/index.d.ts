import { FilterPattern } from '@rollup/pluginutils';
import { Plugin } from 'rollup';
import { Options as SucraseOptions } from 'sucrase/dist/Options';

interface RollupSucraseOptions extends Omit<SucraseOptions, 'filePath' | 'sourceMapOptions'> {
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
}

/**
 * A Rollup plugin which compiles TypeScript, Flow, JSX, etc with
 * [Sucrase](https://github.com/alangpierce/sucrase).
 */
export default function sucrase(options?: RollupSucraseOptions): Plugin;
