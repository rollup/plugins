import type { FilterPattern } from '@rollup/pluginutils';
import type { Plugin } from 'rollup';
import type { Options as SucraseOptions } from 'sucrase';

interface RollupSucraseOptions
  extends Pick<
    SucraseOptions,
    | 'transforms'
    | 'jsxPragma'
    | 'jsxFragmentPragma'
    | 'enableLegacyTypeScriptModuleInterop'
    | 'enableLegacyBabel5ModuleInterop'
    | 'production'
    | 'disableESTransforms'
  > {
  /**
   * A picomatch pattern, or array of patterns, which specifies the files in the build the plugin
   * should operate on.
   * By default all files are targeted.
   */
  include?: FilterPattern;
  /**
   * A picomatch pattern, or array of patterns, which specifies the files in the build the plugin
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
