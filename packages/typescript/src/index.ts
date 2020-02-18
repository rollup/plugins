import * as path from 'path';

import { Plugin } from 'rollup';

import { RollupTypescriptOptions } from '../types';

import emitDiagnostics from './diagnostics/emit';
import createFormattingHost from './diagnostics/host';
import { emitParsedOptionsErrors, getPluginOptions, parseTypescriptConfig } from './options';
import { TSLIB_ID } from './tslib';
import createModuleResolver from './moduleResolution/resolver';

const TS_EXTENSION = /\.tsx?$/;

export default function typescript(options: RollupTypescriptOptions = {}): Plugin {
  const { filter, tsconfig, compilerOptions, tslib, typescript: ts } = getPluginOptions(options);
  const emittedFiles = new Map<string, string>();

  const parsedOptions = parseTypescriptConfig(ts, tsconfig, compilerOptions);
  const formatHost = createFormattingHost(ts, parsedOptions.options);

  const createProgram = ts.createEmitAndSemanticDiagnosticsBuilderProgram;
  type BuilderProgram = ReturnType<typeof createProgram>;
  let host: import('typescript').WatchCompilerHostOfFilesAndCompilerOptions<BuilderProgram>;
  // let watchProgram: import('typescript').WatchOfFilesAndCompilerOptions<BuilderProgram>;

  return {
    name: 'typescript',

    buildStart() {
      emitParsedOptionsErrors(ts, this, parsedOptions);

      host = ts.createWatchCompilerHost(
        parsedOptions.fileNames,
        parsedOptions.options,
        ts.sys,
        createProgram,
        (diagnostic) => emitDiagnostics(ts, this, formatHost, [diagnostic]),
        () => {}
      );
      const resolver = createModuleResolver(ts, { ...formatHost, ...host });

      const origPostProgramCreate = host.afterProgramCreate!;
      host.afterProgramCreate = (program) => {
        const origEmit = program.emit;
        // eslint-disable-next-line no-param-reassign
        program.emit = (targetSourceFile, _, ...args) => {
          function writeFile(fileName: string, data: string) {
            emittedFiles.set(fileName, data);
          }
          return origEmit(targetSourceFile, writeFile, ...args);
        };
        return origPostProgramCreate(program);
      };
      host.resolveModuleNames = (moduleNames, containingFile) =>
        moduleNames.map((moduleName) => resolver(moduleName, containingFile));

      ts.createWatchProgram(host);
    },

    resolveId(importee, importer) {
      if (importee === 'tslib') {
        return TSLIB_ID;
      }

      if (!importer) return null;

      // Convert path from windows separators to posix separators
      const containingFile = importer.split(path.win32.sep).join(path.posix.sep);

      const resolved = host.resolveModuleNames!(
        [importee],
        containingFile,
        undefined,
        undefined,
        parsedOptions.options
      );
      const resolvedFile = resolved[0]?.resolvedFileName;

      if (resolvedFile) {
        if (resolvedFile.endsWith('.d.ts')) return null;
        return resolvedFile;
      }

      return null;
    },

    load(id) {
      if (id === TSLIB_ID) {
        return tslib;
      }

      if (!filter(id)) return null;

      const code = emittedFiles.get(id.replace(TS_EXTENSION, '.js'));
      if (!code) return null;

      return {
        code,
        map: emittedFiles.get(id.replace(TS_EXTENSION, '.map'))
      };
    }
  };
}
