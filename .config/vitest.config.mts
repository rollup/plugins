import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getEarliestDependencies } from './vitest.earliest.mts';

const isAutoInstallPackage = path.basename(process.cwd()) === 'auto-install';
const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getEarliestAliases = (mode: string) =>
  mode === 'earliest'
    ? getEarliestDependencies().map(({ name, path: dependencyPath }) => ({
        find: new RegExp(`^${escapeRegExp(name)}$`),
        replacement: dependencyPath
      }))
    : [];

export default defineConfig(({ mode }) => ({
  test: {
    // Enable global APIs for CommonJS test files.
    globals: true,
    // Phase 1/2/3 packages use runtime-style, top-level test files, *.test, and a few named entrypoints.
    include: [
      'test/*.{js,mjs,cjs,ts,mts,cts}',
      'test/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}',
      'test/{as-input-plugin,as-output-plugin,form,function,misc,sourcemaps}.{js,mjs,cjs,ts,mts,cts}'
    ],
    exclude: [
      '**/test/fixtures/**',
      '**/test/helpers/**',
      '**/test/node_modules/**',
      '**/test/recipes/**',
      '**/test/output/**',
      '**/test/snapshots/**',
      '**/test/types.ts'
    ],
    // These tests switch process cwd and invoke package managers; run files serially there.
    fileParallelism: !isAutoInstallPackage,
    // Keep snapshots in the same location used by Ava.
    resolveSnapshotPath: (testPath, snapExt) =>
      path.join(path.dirname(testPath), 'snapshots', path.basename(testPath) + snapExt),
    setupFiles:
      mode === 'earliest'
        ? [fileURLToPath(new URL('./vitest.setup.earliest.mts', import.meta.url))]
        : []
  },
  resolve: {
    // Allow importing the current package under test via `~package`
    alias: [
      { find: /^~package$/, replacement: path.resolve(process.cwd()) },
      // In earliest mode, resolve imports of aliased dependencies to the earliest supported versions.
      ...getEarliestAliases(mode)
    ]
  }
}));
