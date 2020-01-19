import { readFileSync } from 'fs';
import { resolve } from 'path';

import { createFilter } from '@rollup/pluginutils';
import * as defaultTs from 'typescript';

import { RollupTypescriptOptions } from '../types';

import { diagnosticToWarning } from './diagnostics';
import { getTsLibCode } from './tslib';

/** Properties of `CompilerOptions` that are normally enums */
interface EnumCompilerOptions {
  module: string;
  moduleResolution: string;
  newLine: string;
  jsx: string;
  target: string;
}

/** Typescript compiler options */
type CompilerOptions = import('typescript').CompilerOptions;
/** JSON representation of Typescript compiler options */
type JsonCompilerOptions = Omit<CompilerOptions, keyof EnumCompilerOptions> & EnumCompilerOptions;
/** Compiler options set by the plugin user. */
type PartialCustomOptions = Partial<CompilerOptions> | Partial<JsonCompilerOptions>;

const DEFAULT_COMPILER_OPTIONS: PartialCustomOptions = {
  module: 'esnext',
  sourceMap: true,
  noEmitOnError: true
};

const FORCED_COMPILER_OPTIONS: Partial<CompilerOptions> = {
  // See: https://github.com/rollup/rollup-plugin-typescript/issues/45
  // See: https://github.com/rollup/rollup-plugin-typescript/issues/142
  declaration: false,
  // Delete the `declarationMap` option, as it will cause an error, because we have
  // deleted the `declaration` option.
  declarationMap: false,
  incremental: false,
  // eslint-disable-next-line no-undefined
  tsBuildInfoFile: undefined,
  // Always use tslib
  noEmitHelpers: true,
  importHelpers: true,
  // Typescript needs to emit the code for us to work with
  noEmit: false,
  emitDeclarationOnly: false,
  // Preventing Typescript from resolving code may break compilation
  noResolve: false
};

/**
 * Separate the Rollup plugin options from the Typescript compiler options,
 * and normalize the Rollup options.
 * @returns Object with normalized options:
 * - `filter`: Checks if a file should be included.
 * - `tsconfig`: Path to a tsconfig, or directive to ignore tsconfig.
 * - `compilerOptions`: Custom Typescript compiler options that override tsconfig.
 * - `typescript`: Instance of Typescript library (possibly custom).
 * - `tslib`: ESM code from the tslib helper library (possibly)
 */
export function getPluginOptions(options: RollupTypescriptOptions) {
  const { include, exclude, tsconfig, typescript, tslib, ...compilerOptions } = options;

  const filter = createFilter(
    include || ['*.ts+(|x)', '**/*.ts+(|x)'],
    exclude || ['*.d.ts', '**/*.d.ts']
  );

  return {
    filter,
    tsconfig,
    compilerOptions: compilerOptions as PartialCustomOptions,
    typescript: typescript || defaultTs,
    tslib: getTsLibCode(tslib)
  };
}

/**
 * Finds the path to the tsconfig file relative to the current working directory.
 * @param relativePath Relative tsconfig path given by the user.
 * If `false` is passed, then a null path is returned.
 * @returns The absolute path, or null if the file does not exist.
 */
function getTsConfigPath(ts: typeof import('typescript'), relativePath: string | false) {
  if (relativePath === false) return null;

  // Resolve path to file. `tsConfigOption` defaults to 'tsconfig.json'.
  const tsConfigPath = resolve(process.cwd(), relativePath || 'tsconfig.json');

  if (!ts.sys.fileExists(tsConfigPath)) {
    if (relativePath) {
      // If an explicit path was provided but no file was found, throw
      throw new Error(`Could not find specified tsconfig.json at ${tsConfigPath}`);
    } else {
      return null;
    }
  }

  return tsConfigPath;
}

/**
 * Tries to read the tsconfig file at `tsConfigPath`.
 * @param tsConfigPath Absolute path to tsconfig JSON file.
 * @param explicitPath If true, the path was set by the plugin user.
 * If false, the path was computed automatically.
 */
function readTsConfigFile(ts: typeof import('typescript'), tsConfigPath: string) {
  const { config, error } = ts.readConfigFile(tsConfigPath, (path) => readFileSync(path, 'utf8'));
  if (error) {
    throw Object.assign(Error(), diagnosticToWarning(ts, error));
  }

  const extendedTsConfig: string = config?.extends;
  if (extendedTsConfig) {
    // Get absolute path of `extends`, starting at basedir of the tsconfig file.
    config.extends = resolve(process.cwd(), tsConfigPath, '..', extendedTsConfig);
  }

  return config || {};
}

/**
 * Returns true if any of the `compilerOptions` contain an enum value (i.e.: ts.ScriptKind) rather than a string.
 * This indicates that the internal CompilerOptions type is used rather than the JsonCompilerOptions.
 */
function containsEnumOptions(
  compilerOptions: PartialCustomOptions
): compilerOptions is Partial<CompilerOptions> {
  const enums: Array<keyof EnumCompilerOptions> = [
    'module',
    'target',
    'jsx',
    'moduleResolution',
    'newLine'
  ];
  return enums.some((prop) => prop in compilerOptions && typeof compilerOptions[prop] === 'number');
}

/**
 * Mutates the compiler options to normalize some values for Rollup.
 * @param compilerOptions Compiler options to _mutate_.
 */
function normalizeCompilerOptions(
  ts: typeof import('typescript'),
  compilerOptions: CompilerOptions
) {
  /* eslint-disable no-param-reassign */

  if (compilerOptions.inlineSourceMap) {
    // Force separate source map files for Rollup to work with.
    compilerOptions.sourceMap = true;
    compilerOptions.inlineSourceMap = false;
  } else if (typeof compilerOptions.sourceMap !== 'boolean') {
    // Default to using source maps.
    // If the plugin user sets sourceMap to false we keep that option.
    compilerOptions.sourceMap = true;
  }

  switch (compilerOptions.module) {
    case ts.ModuleKind.ES2015:
    case ts.ModuleKind.ESNext:
    case ts.ModuleKind.CommonJS:
      // OK module type
      return;
    case ts.ModuleKind.None:
    case ts.ModuleKind.AMD:
    case ts.ModuleKind.UMD:
    case ts.ModuleKind.System: {
      // Invalid module type
      const moduleType = ts.ModuleKind[compilerOptions.module];
      throw new Error(
        `@rollup/plugin-typescript: The module kind should be 'ES2015' or 'ESNext, found: '${moduleType}'`
      );
    }
    default:
      // Unknown or unspecified module type, force ESNext
      compilerOptions.module = ts.ModuleKind.ESNext;
  }
}

/**
 * Parse the Typescript config to use with the plugin.
 * @param ts Typescript library instance.
 * @param tsconfig Path to the tsconfig file, or `false` to ignore the file.
 * @param compilerOptions Options passed to the plugin directly for Typescript.
 *
 * @returns Parsed tsconfig.json file with some important properties:
 * - `options`: Parsed compiler options.
 * - `fileNames` Type definition files that should be included in the build.
 * - `errors`: Any errors from parsing the config file.
 */
export function parseTypescriptConfig(
  ts: typeof import('typescript'),
  tsconfig: RollupTypescriptOptions['tsconfig'],
  compilerOptions: PartialCustomOptions
): import('typescript').ParsedCommandLine {
  const cwd = process.cwd();
  let parsedConfig: import('typescript').ParsedCommandLine;

  // Resolve path to file. If file is not found, pass undefined path to `parseJsonConfigFileContent`.
  // eslint-disable-next-line no-undefined
  const tsConfigPath = getTsConfigPath(ts, tsconfig) || undefined;
  const tsConfigFile = tsConfigPath ? readTsConfigFile(ts, tsConfigPath) : {};

  // If compilerOptions has enums, it represents an CompilerOptions object instead of parsed JSON.
  // This determines where the data is passed to the parser.
  if (containsEnumOptions(compilerOptions)) {
    parsedConfig = ts.parseJsonConfigFileContent(
      {
        ...tsConfigFile,
        compilerOptions: {
          ...DEFAULT_COMPILER_OPTIONS,
          ...tsConfigFile.compilerOptions
        }
      },
      ts.sys,
      cwd,
      { ...compilerOptions, ...FORCED_COMPILER_OPTIONS },
      tsConfigPath
    );
  } else {
    parsedConfig = ts.parseJsonConfigFileContent(
      {
        ...tsConfigFile,
        compilerOptions: {
          ...DEFAULT_COMPILER_OPTIONS,
          ...tsConfigFile.compilerOptions,
          ...compilerOptions
        }
      },
      ts.sys,
      cwd,
      FORCED_COMPILER_OPTIONS,
      tsConfigPath
    );
  }

  // We only want to automatically add ambient declaration files.
  // Normal script files are handled by Rollup.
  parsedConfig.fileNames = parsedConfig.fileNames.filter((file) => file.endsWith('.d.ts'));
  normalizeCompilerOptions(ts, parsedConfig.options);

  return parsedConfig;
}
