// The vite alias in vitest.config.mts redirects ESM imports of "rollup" to the aliased
// earliest supported version, but it does not affect require("rollup"). Patch the Node
// module resolution so CommonJS tests resolve the same version.
import Module from 'node:module';
import path from 'node:path';
import { existsSync } from 'node:fs';

type ResolveFilename = (
  request: string,
  parent?: unknown,
  isMain?: boolean,
  options?: unknown
) => string;

const earliestRollupPath = path.resolve(process.cwd(), 'node_modules/rollup-earliest');

// Without the aliased version installed, tests would silently run against the
// current dev version of rollup. Fail loudly instead of passing for the wrong reason.
if (!existsSync(earliestRollupPath)) {
  throw new Error(
    `Missing "${earliestRollupPath}". Run "pnpm install" to test against the earliest supported version.`
  );
}

const originalResolveFilename = (Module as { _resolveFilename?: ResolveFilename })
  ._resolveFilename;

if (originalResolveFilename && !originalResolveFilename.name.includes('earliestRollup')) {
  (Module as { _resolveFilename: ResolveFilename })._resolveFilename =
    function earliestRollup(this: unknown, request, parent, isMain, options) {
      return originalResolveFilename.call(
        this,
        request === 'rollup' ? earliestRollupPath : request,
        parent,
        isMain,
        options
      );
    };
}
