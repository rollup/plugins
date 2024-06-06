import type { Plugin } from 'rollup';

export type VirtualIdResolver = string | ((importer: string | undefined) => string);
export interface RollupVirtualOptions {
  [id: string]: VirtualIdResolver;
}

/**
 * A Rollup plugin which loads virtual modules from memory.
 */
export default function virtual(modules: RollupVirtualOptions): Plugin;
