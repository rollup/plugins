import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';

import type { PluginContext } from 'rollup';
import typescript from 'typescript';
import type {
  Diagnostic,
  ExtendedConfigCacheEntry,
  MapLike,
  ParsedCommandLine,
  ProjectReference,
  TypeAcquisition,
  WatchDirectoryFlags,
  WatchOptions
} from 'typescript';

import type { RollupTypescriptOptions } from '../../types';
import diagnosticToWarning from '../diagnostics/toWarning';

import type { CompilerOptions, EnumCompilerOptions, PartialCompilerOptions } from './interfaces';
import {
  DEFAULT_COMPILER_OPTIONS,
  FORCED_COMPILER_OPTIONS,
  OVERRIDABLE_EMIT_COMPILER_OPTIONS
} from './interfaces';
import { normalizeCompilerOptions, makePathsAbsolute } from './normalize';

const { ModuleKind, ModuleResolutionKind } = typescript;
export interface TypeScriptConfig {
  autoSetSourceMap: boolean;
  options: CompilerOptions;
  typeAcquisition?: TypeAcquisition | undefined;
  fileNames: string[];
  projectReferences?: readonly ProjectReference[] | undefined;
  watchOptions?: WatchOptions | undefined;
  raw?: any;
  errors: Diagnostic[];
  wildcardDirectories?: MapLike<WatchDirectoryFlags> | undefined;
  compileOnSave?: boolean | undefined;
}

function makeForcedCompilerOptions(noForceEmit: boolean) {
  return { ...FORCED_COMPILER_OPTIONS, ...(noForceEmit ? {} : OVERRIDABLE_EMIT_COMPILER_OPTIONS) };
}

/**
 * Finds the path to the tsconfig file relative to the current working directory.
 * @param relativePath Relative tsconfig path given by the user.
 * If `false` is passed, then a null path is returned.
 * @returns The absolute path, or null if the file does not exist.
 */
function getTsConfigPath(ts: typeof typescript, relativePath?: string | false) {
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
function readTsConfigFile(ts: typeof typescript, tsConfigPath: string) {
  const { config, error } = ts.readConfigFile(tsConfigPath, (path) => readFileSync(path, 'utf8'));
  if (error) {
    throw Object.assign(Error(), diagnosticToWarning(ts, null, error));
  }

  return config || {};
}

/**
 * Returns true if any of the `compilerOptions` contain an enum value (i.e.: ts.ScriptKind) rather than a string.
 * This indicates that the internal CompilerOptions type is used rather than the JsonCompilerOptions.
 */
function containsEnumOptions(
  compilerOptions: PartialCompilerOptions
): compilerOptions is Partial<CompilerOptions> {
  const enums: Array<EnumCompilerOptions> = [
    'module',
    'target',
    'jsx',
    'moduleResolution',
    'newLine'
  ];
  return enums.some((prop) => prop in compilerOptions && typeof compilerOptions[prop] === 'number');
}

/**
 * The module resolution kind is a function of the resolved `compilerOptions.module`.
 * This needs to be set explicitly for `resolveModuleName` to select the correct resolution method
 */
function setModuleResolutionKind(parsedConfig: ParsedCommandLine): ParsedCommandLine {
  const moduleKind = parsedConfig.options.module;
  const moduleResolution =
    moduleKind === ModuleKind.Node16
      ? ModuleResolutionKind.Node16
      : moduleKind === ModuleKind.NodeNext
      ? ModuleResolutionKind.NodeNext
      : ModuleResolutionKind.NodeJs;

  return {
    ...parsedConfig,
    options: {
      ...parsedConfig.options,
      moduleResolution
    }
  };
}

const configCache = new Map() as typescript.Map<ExtendedConfigCacheEntry>;

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
  ts: typeof typescript,
  tsconfig: RollupTypescriptOptions['tsconfig'],
  compilerOptions: PartialCompilerOptions,
  noForceEmit: boolean
): TypeScriptConfig {
  /* eslint-disable no-undefined */
  const cwd = process.cwd();
  makePathsAbsolute(compilerOptions, cwd);
  let parsedConfig: ParsedCommandLine;

  // Resolve path to file. If file is not found, pass undefined path to `parseJsonConfigFileContent`.
  // eslint-disable-next-line no-undefined
  const tsConfigPath = getTsConfigPath(ts, tsconfig) || undefined;
  const tsConfigFile = tsConfigPath ? readTsConfigFile(ts, tsConfigPath) : {};
  const basePath = tsConfigPath ? dirname(tsConfigPath) : cwd;

  // If compilerOptions has enums, it represents an CompilerOptions object instead of parsed JSON.
  // This determines where the data is passed to the parser.
  if (containsEnumOptions(compilerOptions)) {
    parsedConfig = setModuleResolutionKind(
      ts.parseJsonConfigFileContent(
        {
          ...tsConfigFile,
          compilerOptions: {
            ...DEFAULT_COMPILER_OPTIONS,
            ...tsConfigFile.compilerOptions
          }
        },
        ts.sys,
        basePath,
        { ...compilerOptions, ...makeForcedCompilerOptions(noForceEmit) },
        tsConfigPath,
        undefined,
        undefined,
        configCache
      )
    );
  } else {
    parsedConfig = setModuleResolutionKind(
      ts.parseJsonConfigFileContent(
        {
          ...tsConfigFile,
          compilerOptions: {
            ...DEFAULT_COMPILER_OPTIONS,
            ...tsConfigFile.compilerOptions,
            ...compilerOptions
          }
        },
        ts.sys,
        basePath,
        makeForcedCompilerOptions(noForceEmit),
        tsConfigPath,
        undefined,
        undefined,
        configCache
      )
    );
  }

  const autoSetSourceMap = normalizeCompilerOptions(ts, parsedConfig.options);

  return {
    ...parsedConfig,
    autoSetSourceMap
  };
}

/**
 * If errors are detected in the parsed options,
 * display all of them as warnings then emit an error.
 */
export function emitParsedOptionsErrors(
  ts: typeof typescript,
  context: PluginContext,
  parsedOptions: ParsedCommandLine
) {
  if (parsedOptions.errors.length > 0) {
    parsedOptions.errors.forEach((error) => context.warn(diagnosticToWarning(ts, null, error)));

    context.error(`@rollup/plugin-typescript: Couldn't process compiler options`);
  }
}
