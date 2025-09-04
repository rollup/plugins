import type { Plugin } from 'rollup';

export interface RollupVirtualOptions {
  [id: string]: string;
}

/**
 * A Rollup plugin which loads virtual modules from memory.
 */
declare function virtual(modules: RollupVirtualOptions): Plugin;
export { virtual, virtual as default };
