import { Plugin } from 'rollup';

export interface RollupWasmOptions {
  /**
   * Specifies an array of strings that each represent a WebAssembly file to load synchronously.
   */
  sync?: readonly string[];
  /**
   * The maximum file size for inline files. If a file exceeds this limit, it will be copied to the destination folder and loaded from a separate file at runtime.
   * If `maxFileSize` is set to `0` all files will be copied.
   * Files specified in `sync` to load synchronously are always inlined, regardless of size.
   */
  maxFileSize?: Number;
  /**
   * A string which will be added in front of filenames when they are not inlined but are copied.
   */
  publicPath?: string;
}

/**
 * 🍣 A Rollup which allows importing and bundling [WebAssembly modules](http://webassembly.org).
 */
export function wasm(options?: RollupWasmOptions): Plugin;
export default wasm;
