import { ChildProcess, fork } from 'child_process';
import * as path from 'path';

import { Plugin, RenderedChunk } from 'rollup';

import { RollupRunOptions } from '../types';

export default function run(opts: RollupRunOptions = {}): Plugin {
  let input: string;
  let proc: ChildProcess;

  const args = opts.args || [];
  const forkOptions = opts.options || opts;
  delete (forkOptions as RollupRunOptions).args;

  return {
    name: 'run',

    options(options) {
      let inputs = options.input!;

      if (typeof inputs === 'string') {
        inputs = [inputs];
      }

      if (typeof inputs === 'object') {
        inputs = Object.values(inputs);
      }

      if (inputs.length > 1) {
        throw new Error(`@rollup/plugin-run only works with a single entry point`);
      }

      input = path.resolve(inputs[0]);
      return options;
    },

    generateBundle(_outputOptions, _bundle, isWrite) {
      if (!isWrite) {
        this.error(`@rollup/plugin-run currently only works with bundles that are written to disk`);
      }
    },

    writeBundle(outputOptions, bundle) {
      const dir = outputOptions.dir || path.dirname(outputOptions.file!);

      let dest: string | undefined;
      for (const fileName of Object.keys(bundle)) {
        const chunk = bundle[fileName] as RenderedChunk;

        // eslint-disable-next-line no-continue
        if (!chunk.isEntry) continue;

        if (chunk.isEntry && chunk.modules[input]) {
          dest = path.join(dir, fileName);
          break;
        }
      }

      if (dest) {
        if (proc) proc.kill();
        proc = fork(dest, args, forkOptions);
      } else {
        this.error(`@rollup/plugin-run could not find output chunk`);
      }
    }
  };
}
