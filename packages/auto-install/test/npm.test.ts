import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import del from 'del';
import { it, expect, afterAll } from 'vitest';
import { rollup } from 'rollup';
import nodeResolve from '@rollup/plugin-node-resolve';

// IMPORTANT: Don't import the plugin at module scope. The plugin requires Node ≥20.19
// (uses import.meta.dirname). Dynamically import it inside gated tests only.

const DIR = fileURLToPath(new URL('.', import.meta.url));
const cwd = path.join(DIR, 'fixtures/npm');
const file = path.join(cwd, 'output/bundle.js');
const input = path.join(cwd, '../input.js');
const pkgFile = path.join(cwd, 'package.json');

// Helper to temporarily disable slow npm features during the test
function stubNpmQuietEnv() {
  const keys = [
    'npm_config_audit',
    'npm_config_fund',
    'npm_config_progress',
    'npm_config_update_notifier',
    'npm_config_loglevel'
  ] as const;
  const prev: Record<string, string | undefined> = {};
  for (const k of keys) prev[k] = process.env[k];
  process.env.npm_config_audit = 'false';
  process.env.npm_config_fund = 'false';
  process.env.npm_config_progress = 'false';
  process.env.npm_config_update_notifier = 'false';
  process.env.npm_config_loglevel = 'error';
  return () => {
    for (const k of keys) {
      const v = prev[k];
      if (v == null) delete (process.env as any)[k];
      else (process.env as any)[k] = v;
    }
  };
}
const [NODE_MAJOR, NODE_MINOR] = process.versions.node.split('.').map(Number);
const RUN_ON_THIS_NODE = NODE_MAJOR > 20 || (NODE_MAJOR === 20 && NODE_MINOR >= 19);

it.runIf(RUN_ON_THIS_NODE)('invalid manager', async () => {
  const { default: autoInstall } = await import('~package');
  expect(() => autoInstall({ pkgFile, manager: 'foo' as any })).toThrow(RangeError);
});

// npm installs can be a bit slower than pnpm/yarn on CI; allow extra time.
it.runIf(RUN_ON_THIS_NODE)(
  'npm',
  async () => {
    const restoreEnv = stubNpmQuietEnv();
    const prevCwd = process.cwd();
    process.chdir(cwd);
    try {
      const { default: autoInstall } = await import('~package');
      const bundle = await rollup({
        input,
        // @ts-expect-error - rollup() ignores output here but tests kept it historically
        output: { file, format: 'es' },
        plugins: [autoInstall({ pkgFile, manager: 'npm' }), nodeResolve()]
      });
      await bundle.close();

      const json = JSON.parse(fs.readFileSync(pkgFile, 'utf-8'));
      expect(json.dependencies && json.dependencies['node-noop']).toBeDefined();
    } finally {
      process.chdir(prevCwd);
      restoreEnv();
    }
  },
  60000
);

afterAll(async () => {
  await del(['node_modules', 'package-lock.json']);
  fs.writeFileSync(pkgFile, '{}');
});
