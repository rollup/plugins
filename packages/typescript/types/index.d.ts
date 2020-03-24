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

export type CustomTransformerFactories = {
  [stage in TransformerStage]: Array<
    StagedTransformerFactory<stage> | CustomTransformerFactory<stage>
  >;
};

type CustomTransformerFactory<T extends TransformerStage> =
  | ProgramTransformerFactory<T>
  | TypeCheckerTransformerFactory<T>;

interface ProgramTransformerFactory<T extends TransformerStage> {
  factory: (program: Program) => StagedTransformerFactory<T> | undefined;

  type: 'program';
}

interface TypeCheckerTransformerFactory<T extends TransformerStage> {
  factory: (typeChecker: TypeChecker) => StagedTransformerFactory<T> | undefined;

  type: 'typeChecker';
}

/**
 * Seamless integration between Rollup and Typescript.
 */
export default function typescript(options?: RollupTypescriptOptions): Plugin;
