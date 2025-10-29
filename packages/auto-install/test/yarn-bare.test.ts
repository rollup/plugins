import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import del from 'del';
import { it, afterAll } from 'vitest';
import { rollup } from 'rollup';
import nodeResolve from '@rollup/plugin-node-resolve';

// Dynamically import the plugin within gated tests to avoid Node <20 execution

const DIR = fileURLToPath(new URL('.', import.meta.url));
const cwd = path.join(DIR, 'fixtures/yarn-bare');
const file = path.join(cwd, 'output/bundle.js');
const input = path.join(cwd, '../input.js');
const pkgFile = path.join(cwd, 'package.json');

const PREV_CWD = process.cwd();
const [NODE_MAJOR, NODE_MINOR] = process.versions.node.split('.').map(Number);
const RUN_ON_THIS_NODE = NODE_MAJOR > 20 || (NODE_MAJOR === 20 && NODE_MINOR >= 19);

it.runIf(RUN_ON_THIS_NODE)('yarn, bare', async () => {
  process.chdir(cwd);
  // Ensure Yarn classic does not traverse to the repo root and read its
  // packageManager (pnpm). When no local package.json exists, Yarn v1 will
  // use the nearest parent package.json and error out. Creating a minimal
  // local package.json with an explicit Yarn version avoids the Corepack gate.
  if (!fs.existsSync(pkgFile)) {
    fs.writeFileSync(
      pkgFile,
      JSON.stringify(
        { name: 'auto-install-yarn-bare-fixture', private: true, packageManager: 'yarn@1.22.22' },
        null,
        2
      )
    );
  }
  const { default: autoInstall } = await import('~package');
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
