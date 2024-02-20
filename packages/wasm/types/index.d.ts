import type { Plugin } from 'rollup';
import type { FilterPattern } from '@rollup/pluginutils';

/**
 * - `"auto"` will determine the environment at runtime and invoke the correct methods accordingly
 * - `"auto-inline"` always inlines the Wasm and will decode it according to the environment
 * - `"browser"` omits emitting code that requires node.js builtin modules that may play havoc on downstream bundlers
 * - `"node"` omits emitting code that requires `fetch`
 */
export type TargetEnv = 'auto' | 'auto-inline' | 'browser' | 'node';

/**
 * The type for the plugin's loader function
 *
 * This is the function that ends up called when encountering a WASM import to load it and turn it into an usable object at runtime.
 *
 * @param {boolean} sync Whether the load should happen synchronously or not
 * @param {string | null} filepath The path to the module.
 * @param {string | null} src The base64-encoded source of the module
 * @param {any} imports An object containing the module's imports
 */
export type WasmLoaderFunction = (
  sync: boolean,
  filepath: string | null,
  src: string,
  imports: any
) => void;

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
   * The loader used to process WASM modules.
   *
   * This plugin provides 4 default loaders:
   * - `"auto"` will determine the environment at runtime and invoke the correct methods accordingly
   * - `"auto-inline"` always inlines the Wasm and will decode it according to the environment
   * - `"browser"` omits emitting code that requires node.js builtin modules that may play havoc on downstream bundlers
   * - `"node"` omits emitting code that requires `fetch`
   *
   * Additionally, you can pass your own loader function if you need better control. The plugin expects a
   * function with the following signature: `_loadWasmModule(sync: boolean, filepath: string, src: string, imports: any)`.
   */
  loader?: TargetEnv | WasmLoaderFunction;
  /**
   * Configures what code is emitted to instantiate the Wasm (both inline and separate)
   * @deprecated Use {@link RollupWasmOptions.loader}
   */
  targetEnv?: TargetEnv;
}

/**
 * 🍣 A Rollup which allows importing and bundling [WebAssembly modules](http://webassembly.org).
 */
export function wasm(options?: RollupWasmOptions): Plugin;
export default wasm;
