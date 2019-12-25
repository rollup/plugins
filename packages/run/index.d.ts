import { Plugin } from 'rollup'

interface RollupRunOptions {
  /**
   * Pass options through to `child_process.fork(...)`
   */
  execArgv?: string[]
}

/**
 * Run your bundles in Node once they're built
 */
export default function run(options?: RollupRunOptions): Plugin
