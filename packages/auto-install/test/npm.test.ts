import fs from 'node:fs';
import path from 'node:path';

import del from 'del';
import { it, expect, afterAll } from 'vitest';
import { rollup } from 'rollup';
import nodeResolve from '@rollup/plugin-node-resolve';

import autoInstall from '~package';

const DIR = import.meta.dirname;
const cwd = path.join(DIR, 'fixtures/npm');
const file = path.join(cwd, 'output/bundle.js');
const input = path.join(cwd, '../input.js');
const pkgFile = path.join(cwd, 'package.json');

const PREV_CWD = process.cwd();

it('invalid manager', () => {
  expect(() => autoInstall({ pkgFile, manager: 'foo' as any })).toThrow(RangeError);
});

it('npm', async () => {
  process.chdir(cwd);
  const bundle = await rollup({
    input,
    // @ts-expect-error - rollup() ignores output here but tests kept it historically
    output: { file, format: 'es' },
    plugins: [autoInstall({ pkgFile, manager: 'npm' }), nodeResolve()]
  });
  await bundle.close();

  const json = JSON.parse(fs.readFileSync(pkgFile, 'utf-8'));
  expect(json.dependencies && json.dependencies['node-noop']).toBeDefined();
});

afterAll(async () => {
  await del(['node_modules', 'package-lock.json']);
  fs.writeFileSync(pkgFile, '{}');
  process.chdir(PREV_CWD);
});
