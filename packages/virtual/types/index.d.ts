import type { Plugin } from 'rollup';

export type RollupVirtualOption = string | ((importer: string | undefined) => string);
export interface RollupVirtualOptions {
  [id: string]: RollupVirtualOption;
}

/**
 * A Rollup plugin which loads virtual modules from memory.
 */
export default function virtual(modules: RollupVirtualOptions): Plugin;
