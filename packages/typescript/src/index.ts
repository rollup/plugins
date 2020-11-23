import * as path from 'path';

import { Plugin, SourceDescription } from 'rollup';

import { RollupTypescriptOptions } from '../types';

import createFormattingHost from './diagnostics/host';
import createModuleResolver from './moduleResolution';
import getPluginOptions from './options/plugin';
import { emitParsedOptionsErrors, parseTypescriptConfig } from './options/tsconfig';
import { validatePaths, validateSourceMap } from './options/validate';
import findTypescriptOutput, { getEmittedFile } from './outputFile';
import createWatchProgram, { WatchProgramHelper } from './watchProgram';
import TSCache from './tscache';

export default function typescript(options: RollupTypescriptOptions = {}): Plugin {
  const {
    cacheDir,
    compilerOptions,
    filter,
    transformers,
    tsconfig,
    tslib,
    typescript: ts
  } = getPluginOptions(options);
  const tsCache = new TSCache(cacheDir);
  const emittedFiles = new Map<string, string>();
  const watchProgramHelper = new WatchProgramHelper();

  const parsedOptions = parseTypescriptConfig(ts, tsconfig, compilerOptions);
  parsedOptions.fileNames = parsedOptions.fileNames.filter(filter);

  const formatHost = createFormattingHost(ts, parsedOptions.options);
  const resolveModule = createModuleResolver(ts, formatHost);

  let program: import('typescript').Watch<unknown> | null = null;

  function normalizePath(fileName: string) {
    return fileName.split(path.win32.sep).join(path.posix.sep);
  }

  return {
    name: 'typescript',

    buildStart() {
      emitParsedOptionsErrors(ts, this, parsedOptions);

      // Fixes a memory leak https://github.com/rollup/plugins/issues/322
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
      validatePaths(ts, this, parsedOptions.options, outputOptions);
    },

    resolveId(importee, importer) {
      if (importee === 'tslib') {
        return tslib;
      }

      if (!importer) return null;

      // Convert path from windows separators to posix separators
      const containingFile = normalizePath(importer);

      const resolved = resolveModule(importee, containingFile);

      if (resolved) {
        if (resolved.extension === '.d.ts') return null;
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

    generateBundle(outputOptions) {
      parsedOptions.fileNames.forEach((fileName) => {
        const output = findTypescriptOutput(ts, parsedOptions, fileName, emittedFiles, tsCache);
        output.declarations.forEach((id) => {
          const code = getEmittedFile(id, emittedFiles, tsCache);
          if (!code) return;

          this.emitFile({
            type: 'asset',
            fileName: normalizePath(path.relative(outputOptions.dir!, id)),
            source: code
          });
        });
      });

      const tsBuildInfoPath = ts.getTsBuildInfoEmitOutputFilePath(parsedOptions.options);
      if (tsBuildInfoPath) {
        this.emitFile({
          type: 'asset',
          fileName: normalizePath(path.relative(outputOptions.dir!, tsBuildInfoPath)),
          source: emittedFiles.get(tsBuildInfoPath)
        });
      }
    }
  };
}
