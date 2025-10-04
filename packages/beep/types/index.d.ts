import type { Plugin } from 'rollup';

/**
 * 🍣 A Rollup plugin that beeps when a build ends with errors.
 */
declare function beep(): Plugin;
export { beep, beep as default };
