import path from 'path';
import os from 'os';
import { clearLine, cursorTo } from 'readline';

import fs from 'fs-extra';
import { PluginImpl } from 'rollup';
import { red } from 'picocolors';

export interface Options {
  /**
   * If `true`, Each message will overwrite the last one.
   * If `false`, Each message will be displayed on the next line of the last one.
   * @default true
   */
  clearLine?: boolean;
}

/**
 * Convert full path to relative path of node execution path
 */
function normalizePath(fullPath: string) {
  return path.relative(process.cwd(), fullPath).split(path.sep).join('/');
}

/**
 * Display the rollup loading progress.
 */
const progress: PluginImpl<Options> = (options?: Options) => {
  const opts = { clearLine: true, ...options };

  let total = 0;
  const totalFilePath = path.resolve(
    os.tmpdir(),
    '@rollup/plugin-progress',
    path.basename(process.cwd())
  );
  fs.ensureFileSync(totalFilePath);
  try {
    const totalTemp = parseInt(fs.readFileSync(totalFilePath).toString(), 10);
    total = Number.isNaN(totalTemp) ? 0 : totalTemp;
  } catch (e) {
    /* istanbul ignore next */
    fs.writeFileSync(totalFilePath, '0');
  }
  const state = {
    total,
    loaded: 0
  };

  return {
    name: 'progress',
    load() {
      state.loaded += 1;
    },
    transform(_code, id) {
      const file = normalizePath(id);
      if (file.includes(':')) {
        /* istanbul ignore next */
        return;
      }

      if (opts.clearLine && process.stdout.isTTY) {
        clearLine(process.stdout, 0);
        cursorTo(process.stdout, 0);
        let output = '';
        if (state.total > 0) {
          const percent = Math.round((100 * state.loaded) / state.total);
          output += `${Math.min(100, percent)}% `;
        }
        output += `(${red(state.loaded)}): ${file}`;
        if (output.length < process.stdout.columns) {
          process.stdout.write(output);
        } else {
          process.stdout.write(output.substring(0, process.stdout.columns - 1));
        }
      } else {
        // eslint-disable-next-line no-console
        console.log(`(${red(state.loaded)}): ${file}`);
      }
    },
    generateBundle() {
      fs.writeFileSync(totalFilePath, String(state.loaded));
      if (opts.clearLine && process.stdout.isTTY) {
        clearLine(process.stdout, 0);
        cursorTo(process.stdout, 0);
      }
    }
  };
};

export default progress;
