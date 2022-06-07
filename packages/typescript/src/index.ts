import * as path from 'path';

import { createFilter } from '@rollup/pluginutils';

import { Plugin, RollupOptions, SourceDescription } from 'rollup';
import type { Watch } from 'typescript';

import { RollupTypescriptOptions } from '../types';

import createFormattingHost from './diagnostics/host';
import createModuleResolver from './moduleResolution';
import { getPluginOptions } from './options/plugin';
import { emitParsedOptionsErrors, parseTypescriptConfig } from './options/tsconfig';
import { validatePaths, validateSourceMap } from './options/validate';
import findTypescriptOutput, { getEmittedFile, normalizePath, emitFile } from './outputFile';
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
    transformers,
    tsconfig,
    tslib,
    typescript: ts
  } = getPluginOptions(options);
  const tsCache = new TSCache(cacheDir);
  const emittedFiles = new Map<string, string>();
  const watchProgramHelper = new WatchProgramHelper();

  const parsedOptions = parseTypescriptConfig(ts, tsconfig, compilerOptions);
  const filter = createFilter(include || ['*.(|c|m)ts+(|x)', '**/*.(|c|m)ts+(|x)'], exclude, {
    resolve: filterRoot ?? parsedOptions.options.rootDir
  });
  parsedOptions.fileNames = parsedOptions.fileNames.filter(filter);

  const formatHost = createFormattingHost(ts, parsedOptions.options);
  const resolveModule = createModuleResolver(ts, formatHost);

  let program: Watch<unknown> | null = null;

  return {
    name: 'typescript',

    buildStart(rollupOptions: RollupOptions) {
      emitParsedOptionsErrors(ts, this, parsedOptions);

      preflight({ config: parsedOptions, context: this, rollupOptions, tslib });

      // Fixes a memory leak https://github.com/rollup/plugins/issues/322
      if (this.meta.watchMode !== true) {
        // eslint-disable-next-line
        program?.close();
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
      const mode = ts.getImpliedNodeFormatForFile?.(
        // @ts-expect-error
        containingFile,
        undefined,
        { ...ts.sys, ...formatHost },
        parsedOptions.options
      );
      const resolved = resolveModule(importee, containingFile, undefined, mode);

      if (resolved) {
        if (resolved.extension.match(/\.d\.[cm]?ts/)) return null;
        return path.normalize(resolved.resolvedFileName);
      }

      return null;
    },

    async load(id) {
      if (!filter(id)) return null;

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
      parsedOptions.fileNames.forEach((fileName) => {
        const output = findTypescriptOutput(ts, parsedOptions, fileName, emittedFiles, tsCache);
        output.declarations.forEach((id) => {
          const code = getEmittedFile(id, emittedFiles, tsCache);
          let baseDir = outputOptions.dir;
          if (!baseDir && tsconfig) {
            baseDir = tsconfig.substring(0, tsconfig.lastIndexOf('/'));
          }
          if (!code || !baseDir) return;

          this.emitFile({
            type: 'asset',
            fileName: normalizePath(path.relative(baseDir, id)),
            source: code
          });
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
