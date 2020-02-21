import { ForkOptions } from 'child_process';

import { Plugin } from 'rollup';

/**
 * Run your bundles in Node once they're built
 * @param options These are passed through to `child_process.fork(..)`
 */
export default function run(options?: ForkOptions): Plugin;
