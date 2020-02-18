import * as path from 'path';

import { Plugin } from 'rollup';

import { RollupTypescriptOptions } from '../types';

import createFormattingHost from './diagnostics/host';
import createWatchHost, { WatchCompilerHost } from './host';
import { emitParsedOptionsErrors, getPluginOptions, parseTypescriptConfig } from './options';
import findTypescriptOutput from './outputFile';

export default function typescript(options: RollupTypescriptOptions = {}): Plugin {
  const { filter, tsconfig, compilerOptions, tslib, typescript: ts } = getPluginOptions(options);
  const emittedFiles = new Map<string, string>();

  const parsedOptions = parseTypescriptConfig(ts, tsconfig, compilerOptions);
  parsedOptions.fileNames = parsedOptions.fileNames.filter(filter);

  const formatHost = createFormattingHost(ts, parsedOptions.options);
  let host: WatchCompilerHost;

  return {
    name: 'typescript',

    buildStart() {
      emitParsedOptionsErrors(ts, this, parsedOptions);
      console.log(parsedOptions.projectReferences)

      host = createWatchHost(ts, this, {
        formatHost,
        parsedOptions,
        writeFile(fileName, data) {
          console.log(fileName);
          emittedFiles.set(fileName, data);
        }
      });

      ts.createWatchProgram(host);
    },

    resolveId(importee, importer) {
      if (importee === 'tslib') {
        return tslib;
      }

      if (!importer) return null;

      // Convert path from windows separators to posix separators
      const containingFile = importer.split(path.win32.sep).join(path.posix.sep);

      const [resolved] = host.resolveModuleNames([importee], containingFile);

      if (resolved) {
        if (resolved.extension === '.d.ts') return null;
        return resolved.resolvedFileName;
      }

      return null;
    },

    load(id) {
      if (!filter(id)) return null;
      console.log('Load: ', id)
      return findTypescriptOutput(id, emittedFiles);
    }
  };
}
