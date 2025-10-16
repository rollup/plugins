import type { ForkOptions } from 'child_process';

import type { Plugin } from 'rollup';

export interface RollupRunOptions extends ForkOptions {
  args?: readonly string[];
  options?: ForkOptions;
  allowRestarts?: boolean;
  input?: string;
}

/**
 * Run your bundles in Node once they're built
 * @param options These are passed through to `child_process.fork(..)`
 */
declare function run(options?: RollupRunOptions): Plugin;
export { run, run as default };
