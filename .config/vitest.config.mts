import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    // Enable global APIs for CommonJS test files.
    globals: true,
    // Phase 1/2 packages use runtime-style, *.test, and a few named entrypoints.
    include: [
      'test/test.{js,mjs,cjs,ts,mts,cts}',
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
    // Keep snapshots in the same location used by Ava.
    resolveSnapshotPath: (testPath, snapExt) =>
      path.join(path.dirname(testPath), 'snapshots', path.basename(testPath) + snapExt)
  },
  resolve: {
    // Allow importing the current package under test via `~package`
    alias: [{ find: /^~package$/, replacement: path.resolve(process.cwd()) }]
  }
});
