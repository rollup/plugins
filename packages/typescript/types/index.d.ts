import { FilterPattern } from '@rollup/pluginutils';
import { Plugin } from 'rollup';
import { CompilerOptions } from 'typescript';

export interface RollupTypescriptPluginOptions {
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
}

/** Properties of `CompilerOptions` that are normally enums */
export type EnumCompilerOptions = 'module' | 'moduleResolution' | 'newLine' | 'jsx' | 'target';

/** JSON representation of Typescript compiler options */
export type JsonCompilerOptions = Omit<CompilerOptions, EnumCompilerOptions> &
  Record<EnumCompilerOptions, string>;

/** Compiler options set by the plugin user. */
export type PartialCompilerOptions = Partial<CompilerOptions> | Partial<JsonCompilerOptions>;

export type RollupTypescriptOptions = RollupTypescriptPluginOptions & PartialCompilerOptions;

/**
 * Seamless integration between Rollup and Typescript.
 */
export default function typescript(options?: RollupTypescriptOptions): Plugin;
