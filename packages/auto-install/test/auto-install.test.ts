import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { describe, it, expect } from 'vitest';
import { rollup, type Plugin } from 'rollup';
import nodeResolve from '@rollup/plugin-node-resolve';

import autoInstall from '~package';

const PACKAGE_ROOT = process.cwd();

async function withFixture(
  fixtureName: string,
  fn: (ctx: { cwd: string; input: string; outputFile: string }) => Promise<void>
) {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'rollup-plugin-auto-install-'));
  const cwd = path.join(tmpDir, 'cwd');
  await fs.mkdir(cwd, { recursive: true });

  const fixturesDir = path.join(PACKAGE_ROOT, 'test', 'fixtures');
  await fs.cp(path.join(fixturesDir, fixtureName), cwd, { recursive: true });

  const input = path.join(cwd, 'input.js');
  await fs.copyFile(path.join(fixturesDir, 'input.js'), input);

  const outputFile = path.join(cwd, 'output', 'bundle.js');
  await fs.mkdir(path.dirname(outputFile), { recursive: true });

  const previousCwd = process.cwd();
  process.chdir(cwd);

  try {
    await fn({ cwd, input, outputFile });
  } finally {
    process.chdir(previousCwd);
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}

async function bundleWithPlugins(input: string, outputFile: string, plugins: Plugin[]) {
  const bundle = await rollup({
    input,
    plugins
  });

  try {
    await bundle.write({
      file: outputFile,
      format: 'cjs'
    });
  } finally {
    await bundle.close();
  }
}

const noopResolvePlugin: Plugin = {
  name: 'noop-resolver',
  resolveId(id) {
    if (id === 'node-noop') return id;
    return null;
  },
  load(id) {
    if (id === 'node-noop') {
      return 'export default {}';
    }
    return null;
  }
};

describe('@rollup/plugin-auto-install', () => {
  it('throws on invalid manager', () => {
    expect(() => autoInstall({ manager: 'foo' as any })).toThrowError(RangeError);
    expect(() => autoInstall({ manager: 'foo' as any })).toThrowError(
      /is not a valid package manager/
    );
  });

  it('npm', async () => {
    await withFixture('npm', async ({ cwd, input, outputFile }) => {
      await bundleWithPlugins(input, outputFile, [
        autoInstall({ pkgFile: path.join(cwd, 'package.json'), manager: 'npm' }),
        nodeResolve()
      ]);

      const json = JSON.parse(await fs.readFile(path.join(cwd, 'package.json'), 'utf-8'));
      expect(json.dependencies?.['node-noop']).toBeDefined();
    });
  }, 50_000);

  it('npm, bare', async () => {
    await withFixture('npm-bare', async ({ cwd, input, outputFile }) => {
      await bundleWithPlugins(input, outputFile, [autoInstall(), nodeResolve()]);

      const json = JSON.parse(await fs.readFile(path.join(cwd, 'package.json'), 'utf-8'));
      expect(json.dependencies?.['node-noop']).toBeDefined();

      const lockFile = await fs.readFile(path.join(cwd, 'package-lock.json'), 'utf-8');
      expect(lockFile).toContain('"node-noop"');
    });
  }, 50_000);

  it('pnpm', async () => {
    await withFixture('pnpm', async ({ cwd, input, outputFile }) => {
      await bundleWithPlugins(input, outputFile, [autoInstall(), nodeResolve()]);

      const json = JSON.parse(await fs.readFile(path.join(cwd, 'package.json'), 'utf-8'));
      expect(json.dependencies?.['node-noop']).toBeDefined();
    });
  }, 50_000);

  it('pnpm, bare', async () => {
    await withFixture('pnpm-bare', async ({ cwd, input, outputFile }) => {
      await bundleWithPlugins(input, outputFile, [autoInstall({ manager: 'pnpm' }), nodeResolve()]);

      const json = JSON.parse(await fs.readFile(path.join(cwd, 'package.json'), 'utf-8'));
      expect(json.dependencies?.['node-noop']).toBeDefined();
    });
  }, 50_000);

  it('yarn', async () => {
    await withFixture('yarn', async ({ cwd, input, outputFile }) => {
      await bundleWithPlugins(input, outputFile, [
        autoInstall({ commands: { yarn: 'echo yarn > yarn.lock' } }),
        noopResolvePlugin,
        nodeResolve()
      ]);

      const lockFile = await fs.readFile(path.join(cwd, 'yarn.lock'), 'utf-8');
      expect(lockFile).toMatch(/yarn\s+node-noop/);
    });
  }, 50_000);

  it('yarn, bare', async () => {
    await withFixture('yarn-bare', async ({ cwd, input, outputFile }) => {
      await bundleWithPlugins(input, outputFile, [
        autoInstall({ manager: 'yarn', commands: { yarn: 'echo yarn.bare > yarn.lock' } }),
        noopResolvePlugin,
        nodeResolve()
      ]);

      const lockFile = await fs.readFile(path.join(cwd, 'yarn.lock'), 'utf-8');
      expect(lockFile).toMatch(/yarn\.bare\s+node-noop/);
    });
  }, 50_000);
});
