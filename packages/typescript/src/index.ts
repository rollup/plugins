import * as path from 'path';

import { Plugin } from 'rollup';

import { RollupTypescriptOptions } from '../types';

import { diagnosticToWarning, emitDiagnostics } from './diagnostics';
import { getPluginOptions, parseTypescriptConfig } from './options';
import { TSLIB_ID } from './tslib';

export default function typescript(options: RollupTypescriptOptions = {}): Plugin {
  const { filter, tsconfig, compilerOptions, tslib, typescript: ts } = getPluginOptions(options);
  const parsedConfig = parseTypescriptConfig(ts, tsconfig, compilerOptions);

  return {
    name: 'typescript',

    buildStart() {
      if (parsedConfig.errors.length > 0) {
        parsedConfig.errors.forEach((error) => this.warn(diagnosticToWarning(ts, error)));

        this.error(`@rollup/plugin-typescript: Couldn't process compiler options`);
      }
    },

    resolveId(importee, importer) {
      if (importee === 'tslib') {
        return TSLIB_ID;
      }

      if (!importer) return null;
      const containingFile = importer.split(path.win32.sep).join(path.posix.sep);

      const result = ts.nodeModuleNameResolver(
        importee,
        containingFile,
        parsedConfig.options,
        ts.sys
      );

      if (result.resolvedModule && result.resolvedModule.resolvedFileName) {
        if (result.resolvedModule.resolvedFileName.endsWith('.d.ts')) {
          return null;
        }

        return result.resolvedModule.resolvedFileName;
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

      const transformed = ts.transpileModule(code, {
        fileName: id,
        reportDiagnostics: true,
        compilerOptions: parsedConfig.options
      });

      emitDiagnostics(ts, this, transformed.diagnostics);

      return {
        code: transformed.outputText,

        // Rollup expects `map` to be an object so we must parse the string
        map: transformed.sourceMapText ? JSON.parse(transformed.sourceMapText) : null
      };
    }
  };
}
