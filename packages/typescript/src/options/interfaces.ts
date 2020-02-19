/** Properties of `CompilerOptions` that are normally enums */
export interface EnumCompilerOptions {
  module: string;
  moduleResolution: string;
  newLine: string;
  jsx: string;
  target: string;
}

/** Typescript compiler options */
export type CompilerOptions = import('typescript').CompilerOptions;
/** JSON representation of Typescript compiler options */
export type JsonCompilerOptions = Omit<CompilerOptions, keyof EnumCompilerOptions> &
  EnumCompilerOptions;
/** Compiler options set by the plugin user. */
export type PartialCustomOptions = Partial<CompilerOptions> | Partial<JsonCompilerOptions>;

export const DEFAULT_COMPILER_OPTIONS: PartialCustomOptions = {
  module: 'esnext',
  noEmitOnError: true,
  skipLibCheck: true
};

export const FORCED_COMPILER_OPTIONS: Partial<CompilerOptions> = {
  // Always use tslib
  noEmitHelpers: true,
  importHelpers: true,
  // Typescript needs to emit the code for us to work with
  noEmit: false,
  emitDeclarationOnly: false,
  // Preventing Typescript from resolving code may break compilation
  noResolve: false
};
