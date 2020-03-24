import { FilterPattern } from '@rollup/pluginutils';
import { Plugin } from 'rollup';
import { CompilerOptionsValue, TsConfigSourceFile, CustomTransformers } from 'typescript';

export interface RollupTypescriptOptions {
  /**
   * Other Typescript compiler options.
   */
  [option: string]:
    | CompilerOptionsValue
    | TsConfigSourceFile
    | RollupTypescriptOptions['include']
    | RollupTypescriptOptions['typescript']
    | RollupTypescriptOptions['tslib']
    | undefined;

  /**
   * Determine which files are transpiled by Typescript (all `.ts` and
   * `.tsx` files by default).
   */
  include?: FilterPattern;
  /**
   * Determine which files are transpiled by Typescript (all `.ts` and
   * `.tsx` files by default).
   */
  exclude?: FilterPattern;
  /**
   * When set to false, ignores any options specified in the config file.
   * If set to a string that corresponds to a file path, the specified file
   * will be used as config file.
   */
  tsconfig?: string | false;
  /**
   * Overrides TypeScript used for transpilation
   */
  typescript?: typeof import('typescript');
  /**
   * Overrides the injected TypeScript helpers with a custom version.
   */
  tslib?: Promise<string> | string;
  /**
   * TypeScript custom transformers
   */
  transformers?: CustomTransformers;
}

/**
 * Seamless integration between Rollup and Typescript.
 */
export default function typescript(options?: RollupTypescriptOptions): Plugin;
