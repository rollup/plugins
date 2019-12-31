import { Plugin } from 'rollup';
import * as ts from 'typescript';
import { createFilter } from '@rollup/pluginutils';

import { RollupTypescriptOptions } from '../types';

import { getDefaultOptions, readTsConfig, adjustCompilerOptions } from './options';
import resolveHost from './resolveHost';
import { getTsLibCode, TSLIB_ID } from './tslib';

export default function typescript(options: RollupTypescriptOptions = {}): Plugin {
  let opts = Object.assign({}, options);

  const filter = createFilter(
    opts.include || ['*.ts+(|x)', '**/*.ts+(|x)'],
    opts.exclude || ['*.d.ts', '**/*.d.ts']
  );

  delete opts.include;
  delete opts.exclude;

  // Allow users to override the TypeScript version used for transpilation and tslib version used for helpers.
  const tsRuntime: typeof import('typescript') = opts.typescript || ts;
  const tslib = getTsLibCode(opts);

  delete opts.typescript;
  delete opts.tslib;

  // Load options from `tsconfig.json` unless explicitly asked not to.
  const tsConfig =
    opts.tsconfig === false ? { compilerOptions: {} } : readTsConfig(tsRuntime, opts.tsconfig);

  delete opts.tsconfig;

  // Since the CompilerOptions aren't designed for the Rollup
  // use case, we'll adjust them for use with Rollup.
  tsConfig.compilerOptions = adjustCompilerOptions(tsConfig.compilerOptions);
  opts = adjustCompilerOptions(opts);

  opts = Object.assign(tsConfig.compilerOptions, getDefaultOptions(), opts);

  // Verify that we're targeting ES2015 modules.
  const moduleType = (opts.module as string).toUpperCase();
  if (
    moduleType !== 'ES2015' &&
    moduleType !== 'ES6' &&
    moduleType !== 'ESNEXT' &&
    moduleType !== 'COMMONJS'
  ) {
    throw new Error(
      `@rollup/plugin-typescript: The module kind should be 'ES2015' or 'ESNext, found: '${opts.module}'`
    );
  }

  const parsed = tsRuntime.convertCompilerOptionsFromJson(opts, process.cwd());

  if (parsed.errors.length) {
    parsed.errors.forEach((error) =>
      // eslint-disable-next-line
      console.error(`@rollup/plugin-typescript: ${error.messageText}`)
    );

    throw new Error(`@rollup/plugin-typescript: Couldn't process compiler options`);
  }

  // let typescript load inheritance chain if there are base configs
  const extendedConfig = tsConfig.extends
    ? tsRuntime.parseJsonConfigFileContent(tsConfig, tsRuntime.sys, process.cwd(), parsed.options)
    : null;

  if (extendedConfig && extendedConfig.errors.length) {
    extendedConfig.errors.forEach((error) =>
      // eslint-disable-next-line
      console.error(`@rollup/plugin-typescript: ${error.messageText}`)
    );

    throw new Error(`@rollup/plugin-typescript: Couldn't process compiler options`);
  }

  const compilerOptions = extendedConfig ? extendedConfig.options : parsed.options;

  return {
    name: 'typescript',

    resolveId(importee, importer) {
      if (importee === 'tslib') {
        return TSLIB_ID;
      }

      if (!importer) return null;
      const containingFile = importer.split('\\').join('/');

      const result = tsRuntime.nodeModuleNameResolver(
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

      const transformed = tsRuntime.transpileModule(code, {
        fileName: id,
        reportDiagnostics: true,
        compilerOptions
      });

      // All errors except `Cannot compile modules into 'es6' when targeting 'ES5' or lower.`
      const diagnostics = transformed.diagnostics
        ? transformed.diagnostics.filter((diagnostic) => diagnostic.code !== 1204)
        : [];

      let fatalError = false;

      diagnostics.forEach((diagnostic) => {
        const message = tsRuntime.flattenDiagnosticMessageText(diagnostic.messageText, '\n');

        if (diagnostic.file) {
          const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(
            diagnostic.start
          );

          this.warn(
            `${diagnostic.file.fileName}(${line + 1},${character + 1}): error TS${
              diagnostic.code
            }: ${message}`
          );
        } else {
          this.warn(`Error: ${message}`);
        }

        if (diagnostic.category === ts.DiagnosticCategory.Error) {
          fatalError = true;
        }
      });

      if (fatalError) {
        throw new Error(`There were TypeScript errors transpiling`);
      }

      return {
        code: transformed.outputText,

        // Rollup expects `map` to be an object so we must parse the string
        map: transformed.sourceMapText ? JSON.parse(transformed.sourceMapText) : null
      };
    }
  };
}
