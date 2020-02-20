/* eslint-disable no-param-reassign */
import { resolve } from 'path';

import { CompilerOptions, PartialCustomOptions } from './interfaces';

export const DIRECTORY_PROPS = ['outDir', 'declarationDir'] as const;

/**
 * Mutates the compiler options to convert paths from relative to absolute.
 * This should be used with compiler options passed through the Rollup plugin options,
 * not those found from loading a tsconfig.json file.
 * @param compilerOptions Compiler options to _mutate_.
 * @param relativeTo Paths are resolved relative to this path.
 */
export function makePathsAbsolute(compilerOptions: PartialCustomOptions, relativeTo: string) {
  for (const pathProp of DIRECTORY_PROPS) {
    if (compilerOptions[pathProp]) {
      compilerOptions[pathProp] = resolve(relativeTo, compilerOptions[pathProp] as string);
    }
  }
}

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
