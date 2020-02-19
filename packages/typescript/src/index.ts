import * as path from 'path';

import { Plugin, SourceDescription } from 'rollup';

import { RollupTypescriptOptions } from '../types';

import createFormattingHost from './diagnostics/host';
import createWatchHost, { WatchCompilerHost } from './host';
import getPluginOptions from './options/plugin';
import { validatePaths, validateSourceMap } from './options/validate';
import { emitParsedOptionsErrors, parseTypescriptConfig } from './options/tsconfig';
import findTypescriptOutput from './outputFile';

export default function typescript(options: RollupTypescriptOptions = {}): Plugin {
  const { filter, tsconfig, compilerOptions, tslib, typescript: ts } = getPluginOptions(options);
  const emittedFiles = new Map<string, string>();
  const declarationFiles = new Set<string>();

  const parsedOptions = parseTypescriptConfig(ts, tsconfig, compilerOptions);
  parsedOptions.fileNames = parsedOptions.fileNames.filter(filter);

  const formatHost = createFormattingHost(ts, parsedOptions.options);
  let host: WatchCompilerHost | null = null;
  let program: import('typescript').Watch<unknown> | null = null;

  return {
    name: 'typescript',

    buildStart() {
      emitParsedOptionsErrors(ts, this, parsedOptions);

      host = createWatchHost(ts, this, {
        formatHost,
        parsedOptions,
        writeFile(fileName, data) {
          emittedFiles.set(fileName, data);
        }
      });

      program = ts.createWatchProgram(host);
    },

    buildEnd() {
      if (process.env.ROLLUP_WATCH !== 'true') {
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
      const containingFile = importer.split(path.win32.sep).join(path.posix.sep);

      const [resolved] = host!.resolveModuleNames([importee], containingFile);

      if (resolved) {
        if (resolved.extension === '.d.ts') return null;
        return resolved.resolvedFileName;
      }

      return null;
    },

    load(id) {
      if (!filter(id)) return null;

      const output = findTypescriptOutput(ts, parsedOptions, id, emittedFiles);
      output.declarations.forEach((declaration) => declarationFiles.add(declaration));

      return output.code ? (output as SourceDescription) : null;
    },

    generateBundle(outputOptions) {
      for (const id of declarationFiles) {
        const code = emittedFiles.get(id);
        if (code) {
          this.emitFile({
            type: 'asset',
            fileName: path.relative(outputOptions.dir!, id),
            source: code
          });
        }
      }
    }
  };
}
