import * as defaultTs from 'typescript';

import type { RollupTypescriptOptions, PartialCompilerOptions } from '../../types';
import { getTsLibPath } from '../tslib';

/**
 * Separate the Rollup plugin options from the Typescript compiler options,
 * and normalize the Rollup options.
 * @returns Object with normalized options:
 * - `filter`: Checks if a file should be included.
 * - `tsconfig`: Path to a tsconfig, or directive to ignore tsconfig.
 * - `compilerOptions`: Custom Typescript compiler options that override tsconfig.
 * - `typescript`: Instance of Typescript library (possibly custom).
 * - `tslib`: ESM code from the tslib helper library (possibly custom).
 */
export const getPluginOptions = (options: RollupTypescriptOptions) => {
  const {
    cacheDir,
    exclude,
    include,
    filterRoot,
    noForceEmit,
    transformers,
    tsconfig,
    tslib,
    typescript,
    outputToFilesystem,
    compilerOptions,
    // previously was compilerOptions
    ...extra
  } = options;

  return {
    cacheDir,
    include,
    exclude,
    filterRoot,
    noForceEmit: noForceEmit || false,
    tsconfig,
    compilerOptions: { ...extra, ...compilerOptions } as PartialCompilerOptions,
    typescript: typescript || defaultTs,
    tslib: tslib || getTsLibPath(),
    transformers,
    outputToFilesystem
  };
};
