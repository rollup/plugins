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
    tsconfig,
    tslib,
    typescript: ts
  } = getPluginOptions(options);
  const tsCache = new TSCache(cacheDir);
  const emittedFiles = new Map<string, string>();
  const watchProgramHelper = new WatchProgramHelper();
  let autoOutDir: string | null = null;

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
  const effectiveOutDir = parsedOptions.options.outDir
    ? path.resolve(parsedOptions.options.outDir)
    : null;
  const filterBase = (filterRoot ?? parsedOptions.options.rootDir) || null;
  const filterBaseAbs = filterBase ? path.resolve(filterBase) : null;
  if (effectiveOutDir) {
    // Avoid excluding sources: skip when the filter base (rootDir) lives inside outDir
    // Use path.relative for a robust cross-platform containment check.
    const outDirContainsFilterBase = filterBaseAbs
      ? (() => {
          const rel = path.relative(effectiveOutDir, filterBaseAbs);
          // rel === '' -> same dir; rel starts with '..' -> outside
          return rel === '' || !(rel === '..' || rel.startsWith(`..${path.sep}`));
        })()
      : false;
    if (!outDirContainsFilterBase) {
      filterExclude.push(normalizePath(path.join(effectiveOutDir, '**')));
    }
  }
  const filter = createFilter(include || defaultInclude, filterExclude, {
    resolve: filterRoot ?? parsedOptions.options.rootDir
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
          transformers
        });
      }
    },

    watchChange(id) {
      if (!filter(id)) return;

      watchProgramHelper.watch();
    },

    buildEnd() {
      if (this.meta.watchMode !== true) {
        // ESLint doesn't understand optional chaining
        // eslint-disable-next-line
        program?.close();
      }
      if (autoOutDir) {
        try {
          fs.rmSync(autoOutDir, { recursive: true, force: true });
        } catch {
          // ignore cleanup failures
        }
        autoOutDir = null;
      }
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
              // @ts-expect-error
              containingFile,
              undefined, // eslint-disable-line no-undefined
              { ...ts.sys, ...formatHost },
              parsedOptions.options
            )
          : undefined; // eslint-disable-line no-undefined

      // eslint-disable-next-line no-undefined
      const resolved = resolveModule(importee, containingFile, undefined, mode);

      if (resolved) {
        if (/\.d\.[cm]?ts/.test(resolved.extension)) return null;
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
