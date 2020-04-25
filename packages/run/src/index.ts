import { ChildProcess, fork } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

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

    buildStart(options) {
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

      // eslint-disable-next-line prefer-destructuring
      input = inputs[0];

      const resolvedInputPath = path.resolve(input);
      if (fs.existsSync(resolvedInputPath)) {
        input = resolvedInputPath;
      }
    },

    generateBundle(_outputOptions, _bundle, isWrite) {
      if (!isWrite) {
        this.error(`@rollup/plugin-run currently only works with bundles that are written to disk`);
      }
    },

    writeBundle(outputOptions, bundle) {
      const dir = outputOptions.dir || path.dirname(outputOptions.file!);
      const entryFileName = Object.keys(bundle).find((fileName) => {
        const chunk = bundle[fileName] as RenderedChunk;
        return chunk.isEntry && chunk.facadeModuleId === input;
      });

      if (entryFileName) {
        if (proc) proc.kill();
        proc = fork(path.join(dir, entryFileName), args, forkOptions);
      } else {
        this.error(`@rollup/plugin-run could not find output chunk`);
      }
    }
  };
}
