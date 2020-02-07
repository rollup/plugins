import * as path from 'path';

import { Plugin } from 'rollup';

import { RollupTypescriptOptions } from '../types';

import { diagnosticToWarning, emitDiagnostics } from './diagnostics';
import getDocumentRegistry from './documentRegistry';
import createHost from './host';
import { getPluginOptions, parseTypescriptConfig } from './options';
import typescriptOutputToRollupTransformation from './outputToRollupTransformation';
import { TSLIB_ID } from './tslib';

export default function typescript(options: RollupTypescriptOptions = {}): Plugin {
  const { filter, tsconfig, compilerOptions, tslib, typescript: ts } = getPluginOptions(options);

  const parsedOptions = parseTypescriptConfig(ts, tsconfig, compilerOptions);
  const host = createHost(ts, parsedOptions);
  const services = ts.createLanguageService(host, getDocumentRegistry(ts, process.cwd()));

  return {
    name: 'typescript',

    buildStart() {
      if (parsedOptions.errors.length > 0) {
        parsedOptions.errors.forEach((error) => this.warn(diagnosticToWarning(ts, host, error)));

        this.error(`@rollup/plugin-typescript: Couldn't process compiler options`);
      }
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
      return null;
    },

    transform(code, id) {
      if (!filter(id)) return null;

      host.addFile(id, code);
      const output = services.getEmitOutput(id);

      if (output.emitSkipped) {
        // Emit failed, print all diagnostics for this file
        const allDiagnostics = ([] as import('typescript').Diagnostic[])
          .concat(services.getSyntacticDiagnostics(id))
          .concat(services.getSemanticDiagnostics(id));
        emitDiagnostics(ts, this, host, allDiagnostics);

        throw new Error(`Couldn't compile ${id}`);
      }

      return typescriptOutputToRollupTransformation(output.outputFiles);
    },

    generateBundle() {
      const program = services.getProgram();
      if (program == null) return;
      emitDiagnostics(ts, this, host, ts.getPreEmitDiagnostics(program));
    }
  };
}
