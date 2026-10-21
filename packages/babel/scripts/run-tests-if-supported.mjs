#!/usr/bin/env node
// Babel 8 requires Node ^22.18.0 || >=24.11.0, but the repo-wide CI matrix also
// runs older Node versions. Skip this package's tests there instead of failing.
import { spawn } from 'node:child_process';

const [major, minor] = process.versions.node.split('.').map(Number);
const supported = (major === 22 && minor >= 18) || (major === 24 && minor >= 11) || major >= 25;

if (!supported) {
  // eslint-disable-next-line no-console
  console.log(
    `skipping tests: Babel 8 requires Node ^22.18.0 || >=24.11.0 (running ${process.versions.node})`
  );
  process.exit(0);
}

const child = spawn(
  'vitest',
  ['--config', '../../.config/vitest.config.mts', 'run', ...process.argv.slice(2)],
  { stdio: 'inherit', shell: process.platform === 'win32' }
);
child.on('exit', (code) => process.exit(code ?? 1));
