import { ChildProcess, fork } from 'child_process';
import { resolve, join, dirname } from 'path';

import { Plugin, RenderedChunk } from 'rollup';

import { RollupRunOptions } from '../types';

export default function run(opts: RollupRunOptions = {}): Plugin {
  let input: string;
  let proc: ChildProcess;

  const args = opts.args || [];
  const allowRestarts = opts.allowRestarts || false;
  const forkOptions = opts.options || opts;
  delete (forkOptions as RollupRunOptions).args;
  delete (forkOptions as RollupRunOptions).allowRestarts;

  return {
    name: 'run',

    buildStart(options) {
      let inputs = options.input;

      if (typeof inputs === 'string') {
        inputs = [inputs];
      }

      if (typeof inputs === 'object') {
        inputs = Object.values(inputs);
      }

      if (inputs.length > 1) {
        throw new Error(`@rollup/plugin-run only works with a single entry point`);
      }

      input = resolve(inputs[0]);
    },

    generateBundle(_outputOptions, _bundle, isWrite) {
      if (!isWrite) {
        this.error(`@rollup/plugin-run currently only works with bundles that are written to disk`);
      }
    },

    writeBundle(outputOptions, bundle) {
      const forkBundle = (dir: string, entryFileName: string) => {
        if (proc) proc.kill();
        proc = fork(join(dir, entryFileName), args, forkOptions);
      };

      const dir = outputOptions.dir || dirname(outputOptions.file!);
      const entryFileName = Object.keys(bundle).find((fileName) => {
        const chunk = bundle[fileName] as RenderedChunk;
        return chunk.isEntry && chunk.facadeModuleId === input;
      });

      if (entryFileName) {
        forkBundle(dir, entryFileName);

        if (allowRestarts) {
          process.stdin.resume();
          process.stdin.setEncoding('utf8');

          process.stdin.on('data', (data) => {
            const line = data.toString().trim().toLowerCase();

            if (line === 'rs' || line === 'restart' || data.toString().charCodeAt(0) === 11) {
              forkBundle(dir, entryFileName);
            } else if (line === 'cls' || line === 'clear' || data.toString().charCodeAt(0) === 12) {
              // eslint-disable-next-line no-console
              console.clear();
            }
          });
        }
      } else {
        this.error(`@rollup/plugin-run could not find output chunk`);
      }
    }
  };
}
