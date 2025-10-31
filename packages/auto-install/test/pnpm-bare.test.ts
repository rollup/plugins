import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import del from 'del';
import { it, afterAll } from 'vitest';
import { rollup } from 'rollup';
import nodeResolve from '@rollup/plugin-node-resolve';

// Dynamically import the plugin within gated tests to avoid Node <20 execution

const DIR = fileURLToPath(new URL('.', import.meta.url));
const cwd = path.join(DIR, 'fixtures/pnpm-bare');
const file = path.join(cwd, 'output/bundle.js');
// Use a local input inside the cwd so Node resolution finds packages installed
// by the test (e.g., on Windows where upward-only resolution won't see
// `pnpm-bare/node_modules` from `fixtures/input.js`).
const input = path.join(cwd, 'input.local.js');

const PREV_CWD = process.cwd();
const [NODE_MAJOR, NODE_MINOR] = process.versions.node.split('.').map(Number);
const RUN_ON_THIS_NODE = NODE_MAJOR > 20 || (NODE_MAJOR === 20 && NODE_MINOR >= 19);

it.runIf(RUN_ON_THIS_NODE)('pnpm, bare', async () => {
  // Create a local copy of the shared input so resolution starts from `cwd`.
  fs.copyFileSync(path.join(cwd, '../input.js'), input);
  process.chdir(cwd);
  const { default: autoInstall } = await import('~package');
  const bundle = await rollup({
    input,
    // @ts-expect-error - rollup() ignores output here but tests kept it historically
    output: { file, format: 'es' },
    plugins: [autoInstall({ manager: 'pnpm' }), nodeResolve()]
  });
  await bundle.close();

  const json = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf-8'));
  if (!json.dependencies || !json.dependencies['node-noop']) {
    throw new Error('Expected node-noop to be added to dependencies');
  }
});

afterAll(async () => {
  // Ensure cleanup runs against the fixture directory, not the repo root
  await del(['node_modules', 'package.json', 'pnpm-lock.yaml'], { cwd });
  try {
    fs.unlinkSync(input);
  } catch {
    /* ignore cleanup errors */
  }
  process.chdir(PREV_CWD);
});
