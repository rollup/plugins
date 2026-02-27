import * as path from 'path';

import { promises as fs } from 'fs';

import type typescript from 'typescript';

import type { ExistingRawSourceMap, OutputOptions, PluginContext, SourceDescription } from 'rollup';
import type { ParsedCommandLine } from 'typescript';

import type TSCache from './tscache';

export interface TypescriptSourceDescription extends Partial<SourceDescription> {
  declarations: string[];
}

/**
 * Checks if the given OutputFile represents some code
 */
export function isCodeOutputFile(name: string): boolean {
  return !isMapOutputFile(name) && !isDeclarationOutputFile(name);
}

/**
 * Checks if the given OutputFile represents some source map
 */
export function isMapOutputFile(name: string): boolean {
  return name.endsWith('.map');
}

/**
 * Checks if the given OutputFile represents some TypeScript source map
 */
export function isTypeScriptMapOutputFile(name: string): boolean {
  return name.endsWith('ts.map');
}

/**
 * Checks if the given OutputFile represents some declaration
 */
export function isDeclarationOutputFile(name: string): boolean {
  return /\.d\.[cm]?ts$/.test(name);
}

/**
 * Returns the content of a filename either from the current
 * typescript compiler instance or from the cached content.
 * @param fileName The filename for the contents to retrieve
 * @param emittedFiles The files emitted in the current typescript instance
 * @param tsCache A cache to files cached by Typescript
 */
export function getEmittedFile(
  fileName: string | undefined,
  emittedFiles: ReadonlyMap<string, string>,
  tsCache: TSCache
): string | undefined {
  let code: string | undefined;
  if (fileName) {
    if (emittedFiles.has(fileName)) {
      code = emittedFiles.get(fileName);
    } else {
      code = tsCache.getCached(fileName);
    }
  }
  return code;
}

/**
 * Finds the corresponding emitted JavaScript files for a given TypeScript file.
 *
 * Returns the transpiled code, an optional sourcemap (with rebased source paths),
 * and a list of declaration file paths.
 *
 * @param ts The TypeScript module instance.
 * @param parsedOptions The parsed TypeScript compiler options (tsconfig).
 * @param id Absolute path to the original TypeScript source file.
 * @param emittedFiles Map of output file paths to their content, populated by the TypeScript compiler during emission.
 * @param tsCache A cache of previously emitted files for incremental builds.
 * @returns An object containing the transpiled code, sourcemap with corrected paths, and declaration file paths.
 */
export default function findTypescriptOutput(
  ts: typeof typescript,
  parsedOptions: ParsedCommandLine,
  id: string,
  emittedFiles: ReadonlyMap<string, string>,
  tsCache: TSCache
): TypescriptSourceDescription {
  const emittedFileNames = ts.getOutputFileNames(
    parsedOptions,
    id,
    !ts.sys.useCaseSensitiveFileNames
  );

  const codeFile = emittedFileNames.find(isCodeOutputFile);
  const mapFile = emittedFileNames.find(isMapOutputFile);

  let map: ExistingRawSourceMap | string | undefined = getEmittedFile(
    mapFile,
    emittedFiles,
    tsCache
  );

  // Rebase sourcemap `sources` paths from the map file's directory to the
  // original source file's directory.
  //
  // Why this is needed:
  //   TypeScript emits sourcemaps with `sources` relative to the **output**
  //   map file location (inside `outDir`), optionally prefixed by `sourceRoot`.
  //   For example, compiling `my-project/src/test.ts` with
  //   `outDir: "../dist/project"` produces `dist/project/src/test.js.map`
  //   containing:
  //
  //     { "sources": ["../../../my-project/src/test.ts"], "sourceRoot": "." }
  //
  //   This resolves correctly from the map file's directory:
  //     resolve("dist/project/src", ".", "../../../my-project/src/test.ts")
  //       → "my-project/src/test.ts"  ✅
  //
  //   However, Rollup's `getCollapsedSourcemap` resolves these paths relative
  //   to `dirname(id)` — the **original source file's directory** — not the
  //   output map file's directory. When `outDir` differs from the source tree
  //   (common in monorepos), this mismatch produces incorrect absolute paths
  //   that escape the project root.
  //
  // The fix resolves each source entry to an absolute path via the map file's
  // directory (honoring `sourceRoot`), then re-relativizes it against the
  // source file's directory so Rollup can consume it correctly.
  if (map && mapFile) {
    try {
      const parsedMap: ExistingRawSourceMap = JSON.parse(map);

      if (parsedMap.sources) {
        const mapDir = path.dirname(mapFile);
        const sourceDir = path.dirname(id);
        const sourceRoot = parsedMap.sourceRoot || '.';

        parsedMap.sources = parsedMap.sources.map((source) => {
          // Resolve to absolute using the map file's directory + sourceRoot
          const absolute = path.resolve(mapDir, sourceRoot, source);
          // Re-relativize against the original source file's directory
          return path.relative(sourceDir, absolute);
        });

        // sourceRoot has been folded into the rebased paths; remove it so
        // Rollup does not double-apply it during sourcemap collapse.
        delete parsedMap.sourceRoot;

        map = parsedMap;
      }
    } catch (e) {
      // If the map string is not valid JSON (shouldn't happen for TypeScript
      // output), fall through and return the original map string unchanged.
    }
  }

  return {
    code: getEmittedFile(codeFile, emittedFiles, tsCache),
    map,
    declarations: emittedFileNames.filter((name) => name !== codeFile && name !== mapFile)
  };
}

export function normalizePath(fileName: string) {
  return fileName.split(path.win32.sep).join(path.posix.sep);
}

export async function emitFile(
  { dir }: OutputOptions,
  outputToFilesystem: boolean | undefined,
  context: PluginContext,
  filePath: string,
  fileSource: string
) {
  const normalizedFilePath = normalizePath(filePath);
  // const normalizedPath = normalizePath(filePath);
  // Note: `dir` can be a value like `dist` in which case, `path.relative` could result in a value
  // of something like `'../.tsbuildinfo'. Our else-case below needs to mimic `path.relative`
  // returning a dot-notated relative path, so the first if-then branch is entered into
  const relativePath = dir ? path.relative(dir, normalizedFilePath) : '..';

  // legal paths do not start with . nor .. : https://github.com/rollup/rollup/issues/3507#issuecomment-616495912
  if (relativePath.startsWith('..')) {
    if (outputToFilesystem == null) {
      context.warn(`@rollup/plugin-typescript: outputToFilesystem option is defaulting to true.`);
    }
    if (outputToFilesystem !== false) {
      await fs.mkdir(path.dirname(normalizedFilePath), { recursive: true });
      await fs.writeFile(normalizedFilePath, fileSource);
    }
  } else {
    context.emitFile({
      type: 'asset',
      fileName: relativePath,
      source: fileSource
    });
  }
}
