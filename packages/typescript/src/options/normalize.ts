/* eslint-disable no-param-reassign */
import { relative, resolve, dirname } from 'path';

import { PluginContext, OutputOptions } from "rollup";

import { CompilerOptions } from './interfaces';

/**
 * Mutates the compiler options to normalize some values for Rollup.
 * @param compilerOptions Compiler options to _mutate_.
 */
export function normalizeCompilerOptions(
  ts: typeof import('typescript'),
  compilerOptions: CompilerOptions
) {
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

export function validatePaths(
  context: PluginContext,
  compilerOptions: CompilerOptions,
  outputOptions: OutputOptions
) {
  /** Checks if the given path lies within Rollup output dir */
  function rollupCanEmit(path: string) {
    const fromRollupDirToTs = relative(outputOptions.dir!, path);
    return !fromRollupDirToTs.startsWith('..');
  }

  if (compilerOptions.out) {
    context.error(`@rollup/plugin-typescript: Deprecated 'out' option is not supported. Use 'outDir' instead.`)
  } else if (compilerOptions.outFile) {
    context.error(`@rollup/plugin-typescript: 'outFile' option is not supported. Use 'outDir' instead.`)
  }

  if (compilerOptions.outDir) {
    if (!outputOptions.dir) {
      context.error(`@rollup/plugin-typescript: 'dir' must be used when 'outDir' is specified.`);
    }

    if (!rollupCanEmit(compilerOptions.outDir)) {
      context.error(`@rollup/plugin-typescript: 'outDir' must be located inside 'dir'.`);
    }
  }
  if (compilerOptions.declarationDir) {
    if (!outputOptions.dir) {
      context.error(`@rollup/plugin-typescript: 'dir' must be used when 'declarationDir' is specified.`);
    }

    if (!rollupCanEmit(compilerOptions.declarationDir)) {
      context.error(`@rollup/plugin-typescript: 'declarationDir' must be located inside 'dir'.`);
    }
  }

  if (compilerOptions.declaration || compilerOptions.declarationMap) {
    if (!compilerOptions.outDir && !compilerOptions.declarationDir) {
      context.error(`@rollup/plugin-typescript: 'outDir' or 'declarationDir' must be specified to generate declaration files.`);
    }
  }
}
