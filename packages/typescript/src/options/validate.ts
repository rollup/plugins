import { relative } from 'path';

import { OutputOptions, PluginContext } from 'rollup';

import { CompilerOptions } from './interfaces';
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
  ts: typeof import('typescript'),
  context: PluginContext,
  compilerOptions: CompilerOptions,
  outputOptions: OutputOptions
) {
  if (compilerOptions.out) {
    context.error(
      `@rollup/plugin-typescript: Deprecated 'out' option is not supported. Use 'outDir' instead.`
    );
  } else if (compilerOptions.outFile) {
    context.error(
      `@rollup/plugin-typescript: 'outFile' option is not supported. Use 'outDir' instead.`
    );
  }

  for (const dirProperty of DIRECTORY_PROPS) {
    if (compilerOptions[dirProperty]) {
      if (!outputOptions.dir) {
        context.error(
          `@rollup/plugin-typescript: 'dir' must be used when '${dirProperty}' is specified.`
        );
      }

      // Checks if the given path lies within Rollup output dir
      const fromRollupDirToTs = relative(outputOptions.dir, compilerOptions[dirProperty]!);
      if (fromRollupDirToTs.startsWith('..')) {
        context.error(`@rollup/plugin-typescript: '${dirProperty}' must be located inside 'dir'.`);
      }
    }
  }

  const tsBuildInfoPath = ts.getTsBuildInfoEmitOutputFilePath(compilerOptions);
  if (tsBuildInfoPath && compilerOptions.incremental) {
    if (!outputOptions.dir) {
      context.error(
        `@rollup/plugin-typescript: 'dir' must be used when 'tsBuildInfoFile' or 'incremental' are specified.`
      );
    }

    // Checks if the given path lies within Rollup output dir
    const fromRollupDirToTs = relative(outputOptions.dir, tsBuildInfoPath);
    if (fromRollupDirToTs.startsWith('..')) {
      context.error(`@rollup/plugin-typescript: 'tsBuildInfoFile' must be located inside 'dir'.`);
    }
  }

  if (compilerOptions.declaration || compilerOptions.declarationMap || compilerOptions.composite) {
    if (DIRECTORY_PROPS.every((dirProperty) => !compilerOptions[dirProperty])) {
      context.error(
        `@rollup/plugin-typescript: 'outDir' or 'declarationDir' must be specified to generate declaration files.`
      );
    }
  }
}
