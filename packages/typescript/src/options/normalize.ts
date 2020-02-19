/* eslint-disable no-param-reassign */
import { resolve, dirname } from 'path';

import { CompilerOptions } from './interfaces';

/**
 * Mutates the compiler options to normalize some values for Rollup.
 * @param compilerOptions Compiler options to _mutate_.
 * @returns True if the source map compiler option was not initially set.
 */
export function normalizeCompilerOptions(
  ts: typeof import('typescript'),
  compilerOptions: CompilerOptions
) {
  let autoSetSourceMap = false;
  if (compilerOptions.inlineSourceMap) {
    // Force separate source map files for Rollup to work with.
    compilerOptions.sourceMap = true;
    compilerOptions.inlineSourceMap = false;
  } else if (typeof compilerOptions.sourceMap !== 'boolean') {
    // Default to using source maps.
    // If the plugin user sets sourceMap to false we keep that option.
    compilerOptions.sourceMap = true;
    autoSetSourceMap = true;
  }

  switch (compilerOptions.module) {
    case ts.ModuleKind.ES2015:
    case ts.ModuleKind.ESNext:
    case ts.ModuleKind.CommonJS:
      // OK module type
      return autoSetSourceMap;
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

  return autoSetSourceMap;
}

/**
 * Mutates the parsed options to normalize paths.
 * By default Typescript makes the paths relative to the working directory rather than the tsconfig file.
 * @param parsedConfig Typescript options to _mutate_.
 * @param tsConfigPath Path to the tsconfig.json file.
 */
export function normalizeProjectReferences(
  parsedConfig: import('typescript').ParsedCommandLine,
  tsConfigPath: string
) {
  parsedConfig.projectReferences = parsedConfig.projectReferences?.map((projectReference) => {
    return {
      ...projectReference,
      path: resolve(dirname(tsConfigPath), projectReference.originalPath!)
    };
  });
}
