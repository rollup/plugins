import * as path from 'path';

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

  const parsedOptions = parseTypescriptConfig(ts, tsconfig, compilerOptions, noForceEmit);
  const filter = createFilter(include || '{,**/}*.(cts|mts|ts|tsx)', exclude, {
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
          // find common path of output.file and configured declation output
          const outputDir = path.dirname(outputOptions.file);
          const configured = path.resolve(
            parsedOptions.options.declarationDir ||
              parsedOptions.options.outDir ||
              tsconfig ||
              process.cwd()
          );
          const backwards = path
            .relative(outputDir, configured)
            .split(path.sep)
            .filter((v) => v === '..')
            .join(path.sep);
          baseDir = path.normalize(`${outputDir}/${backwards}`);
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
