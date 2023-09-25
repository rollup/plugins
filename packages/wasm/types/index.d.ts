import type { Plugin } from 'rollup';
import type { FilterPattern } from '@rollup/pluginutils';

/**
 * - `"auto"` will determine the environment at runtime and invoke the correct methods accordingly
 * - `"auto-inline"` always inlines the Wasm and will decode it according to the environment
 * - `"browser"` omits emitting code that requires node.js builtin modules that may play havoc on downstream bundlers
 * - `"node"` omits emitting code that requires `fetch`
 */
export type TargetEnv = 'auto' | 'auto-inline' | 'browser' | 'node';

export interface RollupWasmOptions {
  /**
   * A picomatch pattern, or array of patterns, which specifies the files in the build the plugin
   * should _ignore_.
   * By default no files are ignored.
   */
  exclude?: FilterPattern;
  /**
   * A picomatch pattern, or array of patterns, which specifies the files in the build the plugin
   * should operate on.
   * By default all wasm files are targeted.
   */
  include?: FilterPattern;
  /**
   * Specifies an array of strings that each represent a WebAssembly file to load synchronously.
   */
  sync?: readonly string[];
  /**
   * The maximum file size for inline files. If a file exceeds this limit, it will be copied to the destination folder and loaded from a separate file at runtime.
   * If `maxFileSize` is set to `0` all files will be copied.
   * Files specified in `sync` to load synchronously are always inlined, regardless of size.
   */
  maxFileSize?: number;
  /**
   * String used to rename the emitted Wasm files.
   */
  fileName?: string;
  /**
   * A string which will be added in front of filenames when they are not inlined but are copied.
   */
  publicPath?: string;
  /**
   * Configures what code is emitted to instantiate the Wasm (both inline and separate)
   */
  targetEnv?: TargetEnv;
}

/**
 * 🍣 A Rollup which allows importing and bundling [WebAssembly modules](http://webassembly.org).
 */
export function wasm(options?: RollupWasmOptions): Plugin;
export default wasm;
