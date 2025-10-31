import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import del from 'del';
import { it, afterAll } from 'vitest';
import { rollup } from 'rollup';
import nodeResolve from '@rollup/plugin-node-resolve';

// Dynamically import the plugin within gated tests to avoid Node <20 execution

const DIR = fileURLToPath(new URL('.', import.meta.url));
const cwd = path.join(DIR, 'fixtures/npm-bare');
const file = path.join(cwd, 'output/bundle.js');
const input = path.join(cwd, '../input.js');
const pkgFile = path.join(cwd, 'package.json');

const PREV_CWD = process.cwd();
// Reduce npm noise/network overhead to avoid slow installs on CI.
const PREV_ENV: Record<string, string | undefined> = {
  npm_config_audit: process.env.npm_config_audit,
  npm_config_fund: process.env.npm_config_fund,
  npm_config_progress: process.env.npm_config_progress,
  npm_config_update_notifier: process.env.npm_config_update_notifier,
  npm_config_loglevel: process.env.npm_config_loglevel
};
process.env.npm_config_audit = 'false';
process.env.npm_config_fund = 'false';
process.env.npm_config_progress = 'false';
process.env.npm_config_update_notifier = 'false';
process.env.npm_config_loglevel = 'error';
const [NODE_MAJOR, NODE_MINOR] = process.versions.node.split('.').map(Number);
const RUN_ON_THIS_NODE = NODE_MAJOR > 20 || (NODE_MAJOR === 20 && NODE_MINOR >= 19);

// npm installs can be slower than pnpm/yarn on CI; allow extra time.
it.runIf(RUN_ON_THIS_NODE)(
  'npm, bare',
  async () => {
    process.chdir(cwd);
    const { default: autoInstall } = await import('~package');
    const bundle = await rollup({
      input,
      // @ts-expect-error - rollup() ignores output here but tests kept it historically
      output: { file, format: 'es' },
      plugins: [autoInstall({ pkgFile, manager: 'npm' }), nodeResolve()]
    });
    await bundle.close();

    const json = JSON.parse(fs.readFileSync(pkgFile, 'utf-8'));
    if (!json.dependencies || !json.dependencies['node-noop']) {
      throw new Error('Expected node-noop to be added to dependencies');
    }
  },
  60000
);

afterAll(async () => {
  await del(['node_modules', 'package.json', 'package-lock.json']);
  process.chdir(PREV_CWD);
  // restore env
  Object.entries(PREV_ENV).forEach(([k, v]) => {
    if (v == null) delete (process.env as any)[k];
    else (process.env as any)[k] = v;
  });
});
