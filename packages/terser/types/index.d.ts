import type { Plugin } from 'rollup';
import type { MinifyOptions } from 'terser';

/**
 * A Rollup plugin to generate a minified output bundle.
 *
 * @param options - Plugin options.
 * @returns Plugin instance.
 */
export default function terser(options?: MinifyOptions): Plugin;
