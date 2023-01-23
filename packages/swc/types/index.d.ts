import type { Plugin } from 'rollup';

import type { Options } from '../src';

/**
 * A Rollup plugin to transpile TypeScript/JavaScript with the speedy-web-compiler (swc).
 *
 * @param options - Plugin options.
 * @returns Plugin instance.
 */
export default function swc(options?: Options): Plugin;
