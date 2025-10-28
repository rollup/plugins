# Upgrade a plugin package to ESM-only (packages/<name>)

Upgrade a single plugin under `packages/<name>` to publish ESM-only output with TypeScript-emitted JS and declarations.

## Prerequisites

- Repo already contains shared config at `.config/tsconfig.base.json` and `.config/tsconfig.plugin.json` and (optionally) `.config/vitest.config.mts` from prior migrations.
- Scope constraint: make changes only inside the target package directory (e.g., `packages/alias`). Do not add or edit files outside `packages/<name>`.
- Local Node 20.19+ to run builds and tests.

## Steps

1. Identify the target package

   - Set a shell variable for reuse: `PKG=packages/<name>`.

2. Package metadata: ESM-only and minimums

   - Edit `$PKG/package.json`:

     - Set `"type": "module"`.
     - Replace legacy `main/module/exports.require` with an ESM-only export mapped via the explicit `"."` entry for broad tooling compatibility:
       ```json
       {
         "exports": {
           ".": {
             "types": "./dist/index.d.ts",
             "import": "./dist/index.js",
             "default": "./dist/index.js"
           }
         },
         "types": "./dist/index.d.ts"
       }
       ```
     - Set minimums: `"engines": { "node": ">=20.19.0" }` and `"peerDependencies": { "rollup": ">=4.0.0" }`.
     - Keep `rollup` as a devDependency only if tests use it. Otherwise remove it.
     - Ensure published files include build output and standard docs:
       ```json
       "files": ["dist", "README.md", "LICENSE"]
       ```
       Note: `package.json` `files` does not support negation patterns. To exclude maps from the published package, add an `.npmignore` entry:

     ```
     dist/**/*.map
     ```

     If you must disable map emission, either update the shared `.config/tsconfig.plugin.json` (affects all packages) or create a package-local `tsconfig.build.json` that extends it with `"sourceMap": false` and `"declarationMap": false`, then change the build script to `tsc --project tsconfig.build.json`.

     If an existing `package.json` contains `"files": [ ..., "!dist/**/*.map", ... ]`, remove the negated entry—negation is not supported and will be ignored.

3. Build scripts: TypeScript emit to dist

   - Prefer a tsc-only build for packages that do not need bundling:
     - In `$PKG/package.json`, set scripts:
       ```json
       "prebuild": "del-cli dist",
       "build": "tsc --project tsconfig.json",
       "pretest": "pnpm build",
       "prerelease": "pnpm build",
       "prepare": "if [ ! -d 'dist' ]; then pnpm build; fi"
       ```
   - If this package still needs bundling for tests/examples, keep its Rollup config but point inputs at the TypeScript output in `dist/` instead of sources.

4. TypeScript config: use the shared plugin config (symlink)

   - Replace any existing `$PKG/tsconfig.json` with a symlink to the shared plugin config (`.config/tsconfig.plugin.json`), which already enables emit to `dist/` and declaration maps:
     ```bash
     # from repo root
     ln -snf ../../.config/tsconfig.plugin.json "$PKG/tsconfig.json"
     git add "$PKG/tsconfig.json"
     ```
     On Windows PowerShell, you can run:
     ```powershell
     # from repo root
     $pkg = 'packages/<name>'
     New-Item -ItemType SymbolicLink -Path "$pkg/tsconfig.json" -Target (Resolve-Path ".config/tsconfig.plugin.json") -Force
     git add "$pkg/tsconfig.json"
     ```
     The shared config content lives at `.config/tsconfig.plugin.json`.
   - Delete any package-local `rollup` build scripts that produced CJS, and remove any `types/` folder if declarations were hand-authored (they will now be generated).

5. Source: convert to pure ESM and modern Node APIs

   - Replace `require`, `module.exports`, and `__dirname` patterns with ESM equivalents.
   - Use `node:` specifiers for built-ins (e.g., `import path from 'node:path'`).
   - Prefer URL utilities where needed (`fileURLToPath(new URL('.', import.meta.url))`).
   - Inline and export public types from `src/index.ts`; avoid separate `types/` unless unavoidable.

6. Tests: drop CJS branches; ESM everywhere

   - Remove CJS-specific branches/assertions from tests.
   - Keep the existing runner (AVA) if it already handles ESM in Node 20. If the package already uses Vitest in this repo, keep that pattern.
   - Ensure Rollup bundles created in tests are `await bundle.close()`-d to avoid leaks.

7. Clean up package artifacts
   - Remove obsolete files that are no longer used by ESM-only publishing (examples):
     - `$PKG/rollup.config.*` if switching to tsc-only.
     - `$PKG/types/**` once declarations are generated to `dist/`.

## Verify

- Build succeeds and emits JS and d.ts to `dist/`:
  ```bash
  pnpm -C $PKG build
  tree $PKG/dist | sed -n '1,80p'
  ```
- Symlink exists and points at the shared config:
  ```bash
  test -L "$PKG/tsconfig.json" && ls -l "$PKG/tsconfig.json" || (echo "tsconfig.json symlink missing" && exit 1)
  ```
- Type declarations resolve for consumers:
  ```bash
  jq -r '.types, .exports["."].types, .exports["."].import' $PKG/package.json
  ```
- Runtime smoke (Node ESM import works):
  ```bash
  node -e "import('file://$PWD/$PKG/dist/index.js').then(() => console.log('ok'))"
  ```
- Tests pass for the package (runner may be AVA or Vitest depending on the package):
  ```bash
  pnpm -C $PKG test
  ```

## Rollback

- Revert the package directory to the previous commit (modern Git):
  ```bash
  git restore -SW $PKG
  ```
- If needed, `git reset --hard HEAD~1` when this package’s change is isolated on a feature branch.

## References

- Alias migration (ESM-only) — PR #1926: feat(alias)!: ESM only. Update Node and Rollup minimum versions
- Task spec used for alias — Issue #1925
- Shared TS configs used by packages — `.config/tsconfig.base.json`, `.config/tsconfig.plugin.json`
