import { PartialCompilerOptions } from '../../types';

export { EnumCompilerOptions, JsonCompilerOptions } from '../../types';
export { PartialCompilerOptions };

/** Typescript compiler options */
export type CompilerOptions = import('typescript').CompilerOptions;

export const DEFAULT_COMPILER_OPTIONS: PartialCompilerOptions = {
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
