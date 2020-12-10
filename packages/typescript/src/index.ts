import * as path from 'path';

import { NormalizedOutputOptions, Plugin, SourceDescription } from 'rollup';
import type { SourceFile, Watch } from 'typescript';
import CommonPathPrefix from 'common-path-prefix';

import { RollupTypescriptOptions } from '../types';

import createFormattingHost from './diagnostics/host';
import createModuleResolver from './moduleResolution';
import getPluginOptions from './options/plugin';
import { emitParsedOptionsErrors, parseTypescriptConfig } from './options/tsconfig';
import { validatePaths, validateSourceMap } from './options/validate';
import getTSGeneratedOutput, { getEmittedFile, TSGeneratedFile } from './outputFile';
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

  const tsGeneratedFiles = new Map<string, TSGeneratedFile>();
  let commonPathPrefix = ``;
  const watchProgramHelper = new WatchProgramHelper();

  const parsedOptions = parseTypescriptConfig(ts, tsconfig, compilerOptions);
  parsedOptions.fileNames = parsedOptions.fileNames.filter(filter);

  const formatHost = createFormattingHost(ts, parsedOptions.options);
  const resolveModule = createModuleResolver(ts, formatHost);

  let program: Watch<unknown> | null = null;

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
          writeFile(
            fileName: string,
            data: string,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            _writeByteOrderMark,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            _onError?,
            sourceFiles?: readonly SourceFile[]
          ) {
            if (parsedOptions.options.composite || parsedOptions.options.incremental) {
              tsCache.cacheCode(fileName, data);
            }
            tsGeneratedFiles.set(fileName, {
              data,
              sourceFileNames: sourceFiles?.map<string>(
                (sourceFile: SourceFile) => sourceFile.fileName
              )
            });
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
      // Calculate the common path prefix of all input & output file.
      // We will use this as a fallback for the "baseDir" for outputting declarations in generateBundle.
      const inputFilenames = [...parsedOptions.fileNames];
      tsGeneratedFiles.forEach((_tsGeneratedFile: TSGeneratedFile, filename: string) =>
        inputFilenames.push(filename)
      );
      commonPathPrefix = CommonPathPrefix(inputFilenames);
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

      const output = getTSGeneratedOutput(id, tsGeneratedFiles, tsCache);

      return output.code != null ? (output as SourceDescription) : null;
    },

    generateBundle(outputOptions: NormalizedOutputOptions) {
      parsedOptions.fileNames.forEach((fileName) => {
        const output = getTSGeneratedOutput(fileName, tsGeneratedFiles, tsCache);
        output.declarations.forEach((id) => {
          const code = getEmittedFile(id, tsGeneratedFiles, tsCache);
          let baseDir = outputOptions.dir;

          // Use the same logic as typescript to decide where to put the declarations.
          // https://www.typescriptlang.org/tsconfig#declarationDir
          // https://www.typescriptlang.org/tsconfig#outDir
          // Using the longest common path prefix as a fallback.
          if (!baseDir) {
            baseDir = parsedOptions.options.declarationDir
              ? parsedOptions.options.declarationDir
              : parsedOptions.options.outDir
              ? parsedOptions.options.outDir
              : commonPathPrefix;
          }

          if (!baseDir) {
            this.error(
              `@rollup/plugin-typescript: Unable to determine directory to write typescript declaration files.  Please specify 'declarationDir' or 'outDir' in your compiler options.`
            );
          }

          if (!code) {
            return;
          }

          this.emitFile({
            type: 'asset',
            fileName: normalizePath(path.relative(baseDir, id)),
            source: code
          });
        });
      });

      const tsBuildInfoPath = ts.getTsBuildInfoEmitOutputFilePath(parsedOptions.options);
      if (tsBuildInfoPath) {
        this.emitFile({
          type: 'asset',
          fileName: normalizePath(path.relative(outputOptions.dir!, tsBuildInfoPath)),
          source: tsGeneratedFiles.get(tsBuildInfoPath)?.data
        });
      }
    }
  };
}
