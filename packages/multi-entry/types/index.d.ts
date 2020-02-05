import { Plugin } from "rollup";

export interface Options {
  /**
   * If `true`, instructs the plugin to export named exports to the bundle from all
   * entries. If `false`, the plugin will not export any entry exports to the bundle.
   * This can be useful when wanting to combine code from multiple entry files, but
   * not necessarily to export each entry file's exports.
   * @default true
   */
  exports?: boolean;
}

/**
 * 🍣 A Rollup plugin which allows use of multiple entry points for a bundle.
 */
export default function multiEntry(options?: Options): Plugin;
