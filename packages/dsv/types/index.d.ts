import type { DSVRowString } from 'd3-dsv';
import type { FilterPattern } from '@rollup/pluginutils';
import type { Plugin } from 'rollup';

interface RollupDsvOptions {
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
   * Specifies a function which processes each row in the parsed array.
   * The function can either manipulate the passed row, or return an entirely new row object.
   * @default undefined
   */
  processRow?: null | ((row: DSVRowString, id: string) => DSVRowString | undefined);
}

/**
 * Convert `.csv` and `.tsv `files into JavaScript modules with `d3-dsv`.
 */
export default function dsv(options?: RollupDsvOptions): Plugin;
