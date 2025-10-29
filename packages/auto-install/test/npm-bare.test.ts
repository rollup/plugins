import fs from 'node:fs';
import path from 'node:path';

import del from 'del';
import { it, afterAll } from 'vitest';
import { rollup } from 'rollup';
import nodeResolve from '@rollup/plugin-node-resolve';

import autoInstall from '~package';

const DIR = import.meta.dirname;
const cwd = path.join(DIR, 'fixtures/npm-bare');
const file = path.join(cwd, 'output/bundle.js');
const input = path.join(cwd, '../input.js');
const pkgFile = path.join(cwd, 'package.json');

const PREV_CWD = process.cwd();
const [NODE_MAJOR, NODE_MINOR] = process.versions.node.split('.').map(Number);
const RUN_ON_THIS_NODE = NODE_MAJOR > 20 || (NODE_MAJOR === 20 && NODE_MINOR >= 19);

it.runIf(RUN_ON_THIS_NODE)('npm, bare', async () => {
  process.chdir(cwd);
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
});

afterAll(async () => {
  await del(['node_modules', 'package.json', 'package-lock.json']);
  process.chdir(PREV_CWD);
});
