import { FilterPattern } from '@rollup/pluginutils';
import { Plugin } from 'rollup';
import {
  CompilerOptionsValue,
  TsConfigSourceFile,
  CustomTransformers,
  Program,
  TypeChecker
} from 'typescript';

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
    | RollupTypescriptOptions['transformers']
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
  transformers?: CustomTransformerFactories;
}

type ElementType<T extends Array<any>> = T extends (infer U)[] ? U : never;

export type TransformerStage = keyof CustomTransformers;
type StagedTransformerFactory<T extends TransformerStage> = ElementType<CustomTransformers[T]>;
type TransformerFactory<T extends TransformerStage> =
  | StagedTransformerFactory<T>
  | ProgramTransformerFactory<T>
  | TypeCheckerTransformerFactory<T>;

export type CustomTransformerFactories = {
  [stage in TransformerStage]?: Array<TransformerFactory<stage>>;
};

interface ProgramTransformerFactory<T extends TransformerStage> {
  type: 'program';

  factory(program: Program): StagedTransformerFactory<T>;
}

interface TypeCheckerTransformerFactory<T extends TransformerStage> {
  type: 'typeChecker';

  factory(typeChecker: TypeChecker): StagedTransformerFactory<T>;
}

/**
 * Seamless integration between Rollup and Typescript.
 */
export default function typescript(options?: RollupTypescriptOptions): Plugin;
