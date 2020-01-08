import { createFilter } from '@rollup/pluginutils';
import { Plugin } from 'rollup';
import * as defaultTs from 'typescript';

import { RollupTypescriptOptions } from '../types';

import {
  adjustCompilerOptions,
  getDefaultOptions,
  parseCompilerOptions,
  readTsConfig,
  validateModuleType
} from './options';
import resolveHost from './resolveHost';
import emitDiagnostics from './diagnostics';
import { getTsLibCode, TSLIB_ID } from './tslib';

export default function typescript(options: RollupTypescriptOptions = {}): Plugin {
  const opts = Object.assign({}, options);

  const filter = createFilter(
    opts.include || ['*.ts+(|x)', '**/*.ts+(|x)'],
    opts.exclude || ['*.d.ts', '**/*.d.ts']
  );
  delete opts.include;
  delete opts.exclude;

  // Allow users to override the TypeScript version used for transpilation and tslib version used for helpers.
  const ts: typeof import('typescript') = opts.typescript || defaultTs;
  delete opts.typescript;

  const tslib = getTsLibCode(opts);
  delete opts.tslib;

  // Load options from `tsconfig.json` unless explicitly asked not to.
  const tsConfig =
    opts.tsconfig === false ? { compilerOptions: {} } : readTsConfig(ts, opts.tsconfig);
  delete opts.tsconfig;

  // Since the CompilerOptions aren't designed for the Rollup
  // use case, we'll adjust them for use with Rollup.
  tsConfig.compilerOptions = adjustCompilerOptions(tsConfig.compilerOptions);

  Object.assign(tsConfig.compilerOptions, getDefaultOptions(), adjustCompilerOptions(opts));

  // Verify that we're targeting ES2015 modules.
  validateModuleType(tsConfig.compilerOptions.module);

  const { options: compilerOptions, errors } = parseCompilerOptions(ts, tsConfig);

  return {
    name: 'typescript',

    buildStart() {
      if (errors.length > 0) {
        errors.forEach((error) => this.warn(`@rollup/plugin-typescript: ${error.messageText}`));

        this.error(`@rollup/plugin-typescript: Couldn't process compiler options`);
      }
    },

    resolveId(importee, importer) {
      if (importee === 'tslib') {
        return TSLIB_ID;
      }

      if (!importer) return null;
      const containingFile = importer.split('\\').join('/');

      const result = ts.nodeModuleNameResolver(
        importee,
        containingFile,
        compilerOptions,
        resolveHost
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
        compilerOptions
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
