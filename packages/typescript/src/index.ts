import * as path from 'path';

import { Plugin, SourceDescription } from 'rollup';

import { RollupTypescriptOptions } from '../types';

import createFormattingHost from './diagnostics/host';
import createModuleResolver from './moduleResolution';
import getPluginOptions from './options/plugin';
import { emitParsedOptionsErrors, parseTypescriptConfig } from './options/tsconfig';
import { validatePaths, validateSourceMap } from './options/validate';
import findTypescriptOutput from './outputFile';
import createWatchProgram from './watchProgram';

export default function typescript(options: RollupTypescriptOptions = {}): Plugin {
  const { filter, tsconfig, compilerOptions, tslib, typescript: ts } = getPluginOptions(options);
  const emittedFiles = new Map<string, string>();

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

      program = createWatchProgram(ts, this, {
        formatHost,
        resolveModule,
        parsedOptions,
        writeFile(fileName, data) {
          emittedFiles.set(fileName, data);
        }
      });
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
        return resolved.resolvedFileName;
      }

      return null;
    },

    load(id) {
      if (!filter(id)) return null;

      const output = findTypescriptOutput(ts, parsedOptions, id, emittedFiles);

      return output.code ? (output as SourceDescription) : null;
    },

    generateBundle(outputOptions) {
      parsedOptions.fileNames.forEach((fileName) => {
        const output = findTypescriptOutput(ts, parsedOptions, fileName, emittedFiles);
        output.declarations.forEach((id) => {
          const code = emittedFiles.get(id);
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
