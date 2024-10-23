import { relative, dirname } from 'path';

import type { OutputOptions, PluginContext } from 'rollup';

import type { CompilerOptions } from './interfaces';
import { DIRECTORY_PROPS } from './normalize';

/**
 * Validate that the `compilerOptions.sourceMap` option matches `outputOptions.sourcemap`.
 * @param context Rollup plugin context used to emit warnings.
 * @param compilerOptions Typescript compiler options.
 * @param outputOptions Rollup output options.
 * @param autoSetSourceMap True if the `compilerOptions.sourceMap` property was set to `true`
 * by the plugin, not the user.
 */
export function validateSourceMap(
  context: PluginContext,
  compilerOptions: CompilerOptions,
  outputOptions: OutputOptions,
  autoSetSourceMap: boolean
) {
  if (compilerOptions.sourceMap && !outputOptions.sourcemap && !autoSetSourceMap) {
    context.warn(
      `@rollup/plugin-typescript: Rollup 'sourcemap' option must be set to generate source maps.`
    );
  } else if (!compilerOptions.sourceMap && outputOptions.sourcemap) {
    context.warn(
      `@rollup/plugin-typescript: Typescript 'sourceMap' compiler option must be set to generate source maps.`
    );
  }
}

/**
 * Validate that the out directory used by Typescript can be controlled by Rollup.
 * @param context Rollup plugin context used to emit errors.
 * @param compilerOptions Typescript compiler options.
 * @param outputOptions Rollup output options.
 */
export function validatePaths(
  context: PluginContext,
  compilerOptions: CompilerOptions,
  outputOptions: OutputOptions
) {
  if (compilerOptions.out) {
    context.error(
      `@rollup/plugin-typescript: Deprecated Typescript compiler option 'out' is not supported. Use 'outDir' instead.`
    );
  } else if (compilerOptions.outFile) {
    context.error(
      `@rollup/plugin-typescript: Typescript compiler option 'outFile' is not supported. Use 'outDir' instead.`
    );
  }

  let outputDir: string | undefined = outputOptions.dir;
  if (outputOptions.file) {
    outputDir = dirname(outputOptions.file);
  }
  for (const dirProperty of DIRECTORY_PROPS) {
    if (compilerOptions[dirProperty] && outputDir) {
      // Checks if the given path lies within Rollup output dir
      if (outputOptions.dir) {
        const fromRollupDirToTs = relative(outputDir, compilerOptions[dirProperty]!);
        if (fromRollupDirToTs.startsWith('..')) {
          context.error(
            `@rollup/plugin-typescript: Path of Typescript compiler option '${dirProperty}' must be located inside Rollup 'dir' option.`
          );
        }
      } else if(dirProperty === 'outDir') {
        const fromTsDirToRollup = relative(compilerOptions[dirProperty]!,outputDir);
        if (fromTsDirToRollup.startsWith('..')) {
            context.error(`@rollup/plugin-typescript: Path of Typescript compiler option '${dirProperty}' must be located inside the same directory as the Rollup 'file' option.`);
        }
      } else {
        const fromTsDirToRollup = relative(outputDir, compilerOptions[dirProperty]!);
        if (fromTsDirToRollup.startsWith('..')) {
          context.error(
            `@rollup/plugin-typescript: Path of Typescript compiler option '${dirProperty}' must be located inside the same directory as the Rollup 'file' option.`
          );
        }
      }
    }
  }

  if (compilerOptions.declaration || compilerOptions.declarationMap || compilerOptions.composite) {
    if (DIRECTORY_PROPS.every((dirProperty) => !compilerOptions[dirProperty])) {
      context.error(
        `@rollup/plugin-typescript: You are using one of Typescript's compiler options 'declaration', 'declarationMap' or 'composite'. ` +
          `In this case 'outDir' or 'declarationDir' must be specified to generate declaration files.`
      );
    }
  }
}
