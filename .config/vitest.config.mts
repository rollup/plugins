import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    // Store snapshots next to each test in a .snapshots folder
    resolveSnapshotPath: (testPath, snapExt) =>
      path.join(path.dirname(testPath), '.snapshots', path.basename(testPath) + snapExt)
  },
  resolve: {
    // Allow importing the current package under test via `~package`
    alias: [{ find: /^~package$/, replacement: path.resolve(process.cwd()) }]
  }
});
