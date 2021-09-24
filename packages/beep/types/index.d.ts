import { Plugin } from 'rollup';

export interface RollupPluginBeepOptions {
  error?: boolean;
  warning?: boolean;
}

/**
 * 🍣 A Rollup plugin that beeps when a build ends with errors.
 * @param options - Plugin options.
 * @returns Plugin instance.
 */
export function beep(options?: RollupPluginBeepOptions): Plugin;
export default beep;
