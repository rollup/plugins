import { createFilter } from '@rollup/pluginutils';
import * as defaultTs from 'typescript';

import { RollupTypescriptOptions } from '../../types';
import getTsLibPath from '../tslib';

import { PartialCustomOptions } from './interfaces';

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
export default function getPluginOptions(options: RollupTypescriptOptions) {
  const { include, exclude, tsconfig, typescript, tslib, ...compilerOptions } = options;

  const filter = createFilter(
    include || ['*.ts+(|x)', '**/*.ts+(|x)'],
    exclude
  );

  return {
    filter,
    tsconfig,
    compilerOptions: compilerOptions as PartialCustomOptions,
    typescript: typescript || defaultTs,
    tslib: tslib || getTsLibPath()
  };
}
