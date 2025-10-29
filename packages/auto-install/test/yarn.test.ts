import fs from 'node:fs';
import path from 'node:path';

import del from 'del';
import { it, afterAll } from 'vitest';
import { rollup } from 'rollup';
import nodeResolve from '@rollup/plugin-node-resolve';

import autoInstall from '~package';

const DIR = import.meta.dirname;
const cwd = path.join(DIR, 'fixtures/yarn');
const file = path.join(cwd, 'output/bundle.js');
const input = path.join(cwd, '../input.js');
const pkgFile = path.join(cwd, 'package.json');

const PREV_CWD = process.cwd();
const [NODE_MAJOR, NODE_MINOR] = process.versions.node.split('.').map(Number);
const RUN_ON_THIS_NODE = NODE_MAJOR > 20 || (NODE_MAJOR === 20 && NODE_MINOR >= 19);

it.runIf(RUN_ON_THIS_NODE)('yarn', async () => {
  process.chdir(cwd);
  // Pre-create a local package.json with an explicit Yarn v1 requirement so
  // the Yarn shim (Corepack) doesn't traverse to the repo root and pick up
  // the root packageManager (pnpm), which would cause a usage error.
  if (!fs.existsSync(pkgFile)) {
    fs.writeFileSync(
      pkgFile,
      JSON.stringify(
        { name: 'auto-install-yarn-fixture', private: true, packageManager: 'yarn@1.22.22' },
        null,
        2
      )
    );
  }
  const bundle = await rollup({
    input,
    // @ts-expect-error - rollup() ignores output here but tests kept it historically
    output: { file, format: 'es' },
    plugins: [autoInstall({ manager: 'yarn' }), nodeResolve()]
  });
  await bundle.close();

  const json = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf-8'));
  if (!json.dependencies || !json.dependencies['node-noop']) {
    throw new Error('Expected node-noop to be added to dependencies');
  }
});

afterAll(async () => {
  await del(['node_modules', 'yarn.lock', 'package.json']);
  process.chdir(PREV_CWD);
});
