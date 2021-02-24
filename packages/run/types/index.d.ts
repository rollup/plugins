import { ForkOptions } from 'child_process';

import { Plugin } from 'rollup';

export interface RollupRunOptions extends ForkOptions {
  args?: readonly string[];
  options?: ForkOptions;
  allowRestarts?: boolean;
}

/**
 * Run your bundles in Node once they're built
 * @param options These are passed through to `child_process.fork(..)`
 */
export default function run(options?: RollupRunOptions): Plugin;
