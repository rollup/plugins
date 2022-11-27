import type { FilterPattern } from '@rollup/pluginutils';
import type { Plugin } from 'rollup';

interface RollupImageOptions {
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
  /**
   * If `true`, instructs the plugin to generate an ES Module which exports a DOM `Image` which can
   * be used with a browser's DOM.
   * Otherwise, the plugin generates an ES Module which exports a `default const` containing the
   * Base64 representation of the image.
   *
   * Using this option set to `true`, the export can be used as such:
   *
   * @example
   * import logo from './rollup.png';
   * document.body.appendChild(logo);
   *
   * @default false
   */
  dom?: boolean;
}

export default function image(options?: RollupImageOptions): Plugin;
