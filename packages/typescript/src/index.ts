import * as path from 'path';

import { Plugin } from 'rollup';

import { RollupTypescriptOptions } from '../types';

import createFormattingHost from './diagnostics/host';
import createWatchHost, { WatchCompilerHost } from './host';
import { emitParsedOptionsErrors, getPluginOptions, parseTypescriptConfig } from './options';
import findTypescriptOutput from './outputFile';
import { TSLIB_ID } from './tslib';

export default function typescript(options: RollupTypescriptOptions = {}): Plugin {
  const { filter, tsconfig, compilerOptions, tslib, typescript: ts } = getPluginOptions(options);
  const emittedFiles = new Map<string, string>();

  const parsedOptions = parseTypescriptConfig(ts, tsconfig, compilerOptions);
  const formatHost = createFormattingHost(ts, parsedOptions.options);
  let host: WatchCompilerHost;

  return {
    name: 'typescript',

    buildStart() {
      emitParsedOptionsErrors(ts, this, parsedOptions);

      host = createWatchHost(ts, this, {
        formatHost,
        compilerOptions: parsedOptions.options,
        fileNames: parsedOptions.fileNames.filter(filter),
        writeFile(fileName, data) {
          emittedFiles.set(fileName, data);
        }
      });

      ts.createWatchProgram(host);
    },

    resolveId(importee, importer) {
      if (importee === 'tslib') {
        return TSLIB_ID;
      }

      if (!importer) return null;

      // Convert path from windows separators to posix separators
      const containingFile = importer.split(path.win32.sep).join(path.posix.sep);

      const resolved = host.resolveModuleNames([importee], containingFile);
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

      return findTypescriptOutput(id, emittedFiles);
    }
  };
}
