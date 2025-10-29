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

const PREV_CWD = process.cwd();

it('yarn', async () => {
  process.chdir(cwd);
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
