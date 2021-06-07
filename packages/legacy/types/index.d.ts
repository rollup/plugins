import {Plugin} from 'rollup'

interface RollupLegacyOptions {
    [key: string]: string | {[key: string]: string}
}

/**
 * A Rollup plugin which adds `export` declarations to legacy non-module scripts.
 */
export default function legacy(options?: RollupLegacyOptions): Plugin
