import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    // Enable global APIs for CommonJS test files.
    globals: true,
    // Phase 1 packages use runtime-style test entrypoints.
    include: ['test/test.{js,mjs,cjs,ts,mts,cts}'],
    // Keep snapshots in the same location used by Ava.
    resolveSnapshotPath: (testPath, snapExt) =>
      path.join(path.dirname(testPath), 'snapshots', path.basename(testPath) + snapExt)
  },
  resolve: {
    // Allow importing the current package under test via `~package`
    alias: [{ find: /^~package$/, replacement: path.resolve(process.cwd()) }]
  }
});
