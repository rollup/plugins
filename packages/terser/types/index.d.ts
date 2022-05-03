import { Plugin } from 'rollup';
import { MinifyOptions } from 'terser';

/**
 * Minify code with Terser
 */
export default function terser(terserOptions?: MinifyOptions): Plugin;
