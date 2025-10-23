/* eslint-disable no-use-before-define */
import type _typescript from 'typescript';

import type { FilterPattern } from '@rollup/pluginutils';
import type { Plugin } from 'rollup';
import type {
  CompilerOptions,
  CompilerOptionsValue,
  CustomTransformers,
  Program,
  TsConfigSourceFile,
  TypeChecker
} from 'typescript';

type ElementType<T extends Array<any> | undefined> = T extends (infer U)[] ? U : never;

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

  /**
   * Factory receives the current Program and may also receive a getter for retrieving
   * the Program at call time. The getter may be provided in all modes. In non-watch it
   * returns the same Program as the first argument. In watch mode:
   *  - When `recreateTransformersOnRebuild` is enabled (plugin option), the getter
   *    reflects the latest Program across rebuilds.
   *  - When disabled (default, legacy behavior), factories are reused and the getter
   *    refers to the initial Program from when the factory was created.
   * The second parameter remains optional for backwards compatibility with existing
   * transformer factories.
   */
  factory(program: Program, getProgram?: () => Program): StagedTransformerFactory<T>;
}

interface TypeCheckerTransformerFactory<T extends TransformerStage> {
  type: 'typeChecker';

  factory(typeChecker: TypeChecker): StagedTransformerFactory<T>;
}

export interface RollupTypescriptPluginOptions {
  /**
   * If using incremental this is the folder where the cached
   * files will be created and kept for Typescript incremental
   * compilation.
   */
  cacheDir?: string;
  /**
   * Determine which files are transpiled by Typescript (all `.ts` and
   * `.tsx` files by default).
   */
  include?: FilterPattern;
  /**
   * Determine which files are ignored by Typescript
   */
  exclude?: FilterPattern;
  /**
   * Sets the `resolve` value for the underlying filter function.  If not set will use the `rootDir` property
   * @see {@link https://github.com/rollup/plugins/tree/master/packages/pluginutils#createfilter} @rollup/pluginutils `createFilter`
   */
  filterRoot?: string | false;
  /**
   * When set to false, ignores any options specified in the config file.
   * If set to a string that corresponds to a file path, the specified file
   * will be used as config file.
   */
  tsconfig?: string | false;
  /**
   * Overrides TypeScript used for transpilation
   */
  typescript?: typeof _typescript;
  /**
   * Overrides the injected TypeScript helpers with a custom version.
   */
  tslib?: Promise<string> | string;
  /**
   * TypeScript custom transformers
   */
  transformers?: CustomTransformerFactories | ((program: Program) => CustomTransformers);
  /**
   * When set to false, force non-cached files to always be emitted in the output directory.output
   * If not set, will default to true with a warning.
   */
  outputToFilesystem?: boolean;
  /**
   * Pass additional compiler options to the plugin.
   */
  compilerOptions?: PartialCompilerOptions;
  /**
   * Override force setting of `noEmit` and `emitDeclarationOnly` and use what is defined in `tsconfig.json`
   */
  noForceEmit?: boolean;
  /**
   * Advanced: when true, recreate custom transformer factories on each TypeScript
   * watch rebuild so that `program`/`typeChecker`-based factories are rebuilt and
   * `getProgram()` (when used) reflects the latest Program across rebuilds.
   * Defaults to false (legacy behavior), which reuses factories for the lifetime
   * of the watch session.
   */
  recreateTransformersOnRebuild?: boolean;
}

export interface FlexibleCompilerOptions extends CompilerOptions {
  [option: string]: CompilerOptionsValue | TsConfigSourceFile | undefined | any;
}

/** Properties of `CompilerOptions` that are normally enums */
export type EnumCompilerOptions = 'module' | 'moduleResolution' | 'newLine' | 'jsx' | 'target';

/** JSON representation of Typescript compiler options */
export type JsonCompilerOptions = Omit<FlexibleCompilerOptions, EnumCompilerOptions> &
  Record<EnumCompilerOptions, string>;

/** Compiler options set by the plugin user. */
export type PartialCompilerOptions =
  | Partial<FlexibleCompilerOptions>
  | Partial<JsonCompilerOptions>;

export type RollupTypescriptOptions = RollupTypescriptPluginOptions & PartialCompilerOptions;

/**
 * Seamless integration between Rollup and Typescript.
 */
export default function typescript(options?: RollupTypescriptOptions): Plugin;
