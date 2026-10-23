// The vite aliases in vitest.config.mts redirect ESM imports of the aliased dependencies to
// their earliest supported versions, but they do not affect require(...). Patch the Node
// module resolution so CommonJS tests resolve the same versions.
import Module from 'node:module';

import { getEarliestDependencies } from './vitest.earliest.mts';

type ResolveFilename = (
  request: string,
  parent?: unknown,
  isMain?: boolean,
  options?: unknown
) => string;

const earliestPaths = new Map(
  getEarliestDependencies().map(({ name, path }) => [name, path] as const)
);

const originalResolveFilename = (Module as { _resolveFilename?: ResolveFilename })._resolveFilename;

if (
  originalResolveFilename &&
  !originalResolveFilename.name.includes('redirectEarliestDependencies')
) {
  (Module as { _resolveFilename: ResolveFilename })._resolveFilename =
    function redirectEarliestDependencies(this: unknown, request, parent, isMain, options) {
      return originalResolveFilename.call(
        this,
        earliestPaths.get(request) ?? request,
        parent,
        isMain,
        options
      );
    };
}
