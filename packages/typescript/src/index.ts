import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

import { createFilter } from '@rollup/pluginutils';

import type { Plugin, SourceDescription } from 'rollup';
import type { Watch } from 'typescript';

import type { RollupTypescriptOptions } from '../types';

import createFormattingHost from './diagnostics/host';
import createModuleResolver from './moduleResolution';
import { getPluginOptions } from './options/plugin';
import { emitParsedOptionsErrors, parseTypescriptConfig } from './options/tsconfig';
import { validatePaths, validateSourceMap } from './options/validate';
import findTypescriptOutput, {
  getEmittedFile,
  normalizePath,
  emitFile,
  isDeclarationOutputFile,
  isTypeScriptMapOutputFile
} from './outputFile';
import { preflight } from './preflight';
import createWatchProgram, { WatchProgramHelper } from './watchProgram';
import TSCache from './tscache';

export default function typescript(options: RollupTypescriptOptions = {}): Plugin {
  const {
    cacheDir,
    compilerOptions,
    exclude,
    filterRoot,
    include,
    outputToFilesystem,
    noForceEmit,
    transformers,
    recreateTransformersOnRebuild,
    tsconfig,
    tslib,
    typescript: ts
  } = getPluginOptions(options);
  const tsCache = new TSCache(cacheDir);
  const emittedFiles = new Map<string, string>();
  const watchProgramHelper = new WatchProgramHelper();
  let autoOutDir: string | null = null;
  // Centralize temp outDir cleanup to avoid duplication/drift across hooks
  const cleanupAutoOutDir = () => {
    if (!autoOutDir) return;
    try {
      fs.rmSync(autoOutDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup failures
    }
    autoOutDir = null;
  };
  // Ensure the TypeScript watch program is closed and temp outDir is cleaned
  // even if closing throws. Call this from lifecycle hooks that need teardown.
  const closeProgramAndCleanup = () => {
    try {
      // ESLint doesn't understand optional chaining
      // eslint-disable-next-line
      program?.close();
    } finally {
      cleanupAutoOutDir();
    }
  };

  const parsedOptions = parseTypescriptConfig(ts, tsconfig, compilerOptions, noForceEmit);

  // When processing JS via allowJs, redirect emit output away from source files
  // to avoid TS5055 (cannot write file because it would overwrite input file).
  // We only set a temp outDir if the user did not configure one.
  if (parsedOptions.options.allowJs && !parsedOptions.options.outDir) {
    // Create a unique temporary outDir to avoid TS5055 when emitting JS
    autoOutDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rollup-plugin-typescript-allowjs-'));
    parsedOptions.options.outDir = autoOutDir;
  }

  // Determine default include pattern. By default we only process TS files.
  // When the consumer enables `allowJs` in their tsconfig/compiler options,
  // also include common JS extensions so modern JS syntax in .js files is
  // downleveled by TypeScript as expected.
  const defaultInclude = parsedOptions.options.allowJs
    ? '{,**/}*.{cts,mts,ts,tsx,js,jsx,mjs,cjs}'
    : '{,**/}*.{cts,mts,ts,tsx}';

  // Build filter exclusions, ensuring we never re-process TypeScript emit outputs.
  // Always exclude the effective outDir (user-provided or the auto-created temp dir).
  const filterExclude = Array.isArray(exclude) ? [...exclude] : exclude ? [exclude] : [];
  // When auto-expanding to include JS (allowJs) and the user did not provide
  // custom include/exclude patterns, avoid transforming third-party code by
  // default by excluding node_modules.
  if (parsedOptions.options.allowJs && !include && !exclude) {
    filterExclude.push('**/node_modules/**');
  }
  const effectiveOutDir = parsedOptions.options.outDir
    ? path.resolve(parsedOptions.options.outDir)
    : null;
  // Determine the base used for containment checks. If pattern resolution is disabled
  // (filterRoot === false), fall back to process.cwd() so we don't accidentally
  // exclude sources when e.g. outDir='.'.
  const willResolvePatterns = filterRoot !== false;
  // Only treat string values of `filterRoot` as a base directory; booleans (e.g., true)
  // should not flow into path resolution. Fallback to the tsconfig `rootDir` when not set.
  const configuredBase = willResolvePatterns
    ? typeof filterRoot === 'string'
      ? filterRoot
      : parsedOptions.options.rootDir
    : null;
  const filterBaseAbs = configuredBase ? path.resolve(configuredBase) : null;
  if (effectiveOutDir) {
    // Avoid excluding sources: skip when the filter base (or cwd fallback) lives inside outDir.
    // Use path.relative with root equality guard for cross-platform correctness.
    const baseForContainment = filterBaseAbs ?? process.cwd();
    const outDirContainsFilterBase = (() => {
      // Different roots (e.g., drive letters on Windows) cannot be in a parent/child relationship.
      // Normalize Windows drive-letter case before comparison to avoid false mismatches.
      const getRoot = (p: string) => {
        const r = path.parse(p).root;
        return process.platform === 'win32' ? r.toLowerCase() : r;
      };
      if (getRoot(effectiveOutDir) !== getRoot(baseForContainment)) return false;
      const rel = path.relative(effectiveOutDir, baseForContainment);
      // rel === '' -> same dir; absolute or '..' => outside
      return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
    })();
    if (!outDirContainsFilterBase) {
      filterExclude.push(normalizePath(path.join(effectiveOutDir, '**')));
    }
  }
  const filter = createFilter(include || defaultInclude, filterExclude, {
    // Guard against non-string truthy values (e.g., boolean true). Only strings are valid
    // for `resolve`; `false` disables resolution. Otherwise, fall back to `rootDir`.
    resolve:
      typeof filterRoot === 'string'
        ? filterRoot
        : filterRoot === false
        ? false
        : parsedOptions.options.rootDir || process.cwd()
  });
  parsedOptions.fileNames = parsedOptions.fileNames.filter(filter);

  const formatHost = createFormattingHost(ts, parsedOptions.options);
  const resolveModule = createModuleResolver(ts, formatHost, filter);

  let program: Watch<unknown> | null = null;

  return {
    name: 'typescript',

    buildStart(rollupOptions) {
      emitParsedOptionsErrors(ts, this, parsedOptions);

      preflight({
        config: parsedOptions,
        context: this,
        // TODO drop rollup@3 support and remove
        inputPreserveModules: (rollupOptions as unknown as { preserveModules: boolean })
          .preserveModules,
        tslib
      });

      // Fixes a memory leak https://github.com/rollup/plugins/issues/322
      if (this.meta.watchMode !== true) {
        // eslint-disable-next-line
        program?.close();
        program = null;
      }
      if (!program) {
        program = createWatchProgram(ts, this, {
          formatHost,
          resolveModule,
          parsedOptions,
          writeFile(fileName, data) {
            if (parsedOptions.options.composite || parsedOptions.options.incremental) {
              tsCache.cacheCode(fileName, data);
            }
            emittedFiles.set(fileName, data);
          },
          status(diagnostic) {
            watchProgramHelper.handleStatus(diagnostic);
          },
          transformers,
          recreateTransformersOnRebuild
        });
      }
    },

    watchChange(id) {
      if (!filter(id)) return;

      watchProgramHelper.watch();
    },

    buildEnd() {
      if (this.meta.watchMode !== true) {
        closeProgramAndCleanup();
      }
    },

    // Ensure program is closed and temp outDir is removed exactly once when watch stops
    closeWatcher() {
      closeProgramAndCleanup();
    },

    renderStart(outputOptions) {
      validateSourceMap(this, parsedOptions.options, outputOptions, parsedOptions.autoSetSourceMap);
      validatePaths(this, parsedOptions.options, outputOptions);
    },

    resolveId(importee, importer) {
      if (importee === 'tslib') {
        return tslib;
      }

      if (!importer) return null;

      // Convert path from windows separators to posix separators
      const containingFile = normalizePath(importer);

      // when using node16 or nodenext module resolution, we need to tell ts if
      // we are resolving to a commonjs or esnext module
      const mode =
        typeof ts.getImpliedNodeFormatForFile === 'function'
          ? ts.getImpliedNodeFormatForFile(
              containingFile,
              undefined, // eslint-disable-line no-undefined
              { ...ts.sys, ...formatHost },
              parsedOptions.options
            )
          : undefined; // eslint-disable-line no-undefined

      // eslint-disable-next-line no-undefined
      const resolved = resolveModule(importee, containingFile, undefined, mode);

      if (resolved) {
        if (isDeclarationOutputFile(resolved.extension)) return null;
        if (!filter(resolved.resolvedFileName)) return null;
        return path.normalize(resolved.resolvedFileName);
      }

      return null;
    },

    async load(id) {
      if (!filter(id)) return null;

      this.addWatchFile(id);
      await watchProgramHelper.wait();

      const fileName = normalizePath(id);
      if (!parsedOptions.fileNames.includes(fileName)) {
        // Discovered new file that was not known when originally parsing the TypeScript config
        parsedOptions.fileNames.push(fileName);
      }

      const output = findTypescriptOutput(ts, parsedOptions, id, emittedFiles, tsCache);

      return output.code != null ? (output as SourceDescription) : null;
    },

    async generateBundle(outputOptions) {
      const declarationAndTypeScriptMapFiles = [...emittedFiles.keys()].filter(
        (fileName) => isDeclarationOutputFile(fileName) || isTypeScriptMapOutputFile(fileName)
      );

      declarationAndTypeScriptMapFiles.forEach((id) => {
        const code = getEmittedFile(id, emittedFiles, tsCache);
        if (!code || !parsedOptions.options.declaration) {
          return;
        }

        let baseDir: string | undefined;
        if (outputOptions.dir) {
          baseDir = outputOptions.dir;
        } else if (outputOptions.file) {
          // the bundle output directory used by rollup when outputOptions.file is used instead of outputOptions.dir
          baseDir = path.dirname(outputOptions.file);
        }
        if (!baseDir) return;

        this.emitFile({
          type: 'asset',
          fileName: normalizePath(path.relative(baseDir, id)),
          source: code
        });
      });

      const tsBuildInfoPath = ts.getTsBuildInfoEmitOutputFilePath(parsedOptions.options);
      if (tsBuildInfoPath) {
        const tsBuildInfoSource = emittedFiles.get(tsBuildInfoPath);
        // https://github.com/rollup/plugins/issues/681
        if (tsBuildInfoSource) {
          await emitFile(
            outputOptions,
            outputToFilesystem,
            this,
            tsBuildInfoPath,
            tsBuildInfoSource
          );
        }
      }
    }
  };
}
