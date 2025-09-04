import type { Plugin } from 'rollup';

interface RollupLegacyOptions {
  [key: string]: string | { [key: string]: string };
}

/**
 * A Rollup plugin which adds `export` declarations to legacy non-module scripts.
 */
declare function legacy(options: RollupLegacyOptions): Plugin;
export { legacy, legacy as default };
