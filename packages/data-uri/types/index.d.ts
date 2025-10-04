import type { Plugin } from 'rollup';

/**
 * A Rollup plugin which imports modules from Data URIs.
 */
declare function dataUri(): Plugin;
export { dataUri, dataUri as default };
