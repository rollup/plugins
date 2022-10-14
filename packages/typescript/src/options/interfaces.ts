import type { CompilerOptions } from 'typescript';

import type { PartialCompilerOptions } from '../../types';

export type { EnumCompilerOptions, JsonCompilerOptions } from '../../types';
export { PartialCompilerOptions };

/** Typescript compiler options */
export type { CompilerOptions } from 'typescript';

export const DEFAULT_COMPILER_OPTIONS: PartialCompilerOptions = {
  module: 'esnext',
  skipLibCheck: true
};

export const OVERRIDABLE_EMIT_COMPILER_OPTIONS: Partial<CompilerOptions> = {
  noEmit: false,
  emitDeclarationOnly: false
};

export const FORCED_COMPILER_OPTIONS: Partial<CompilerOptions> = {
  // Always use tslib
  noEmitHelpers: true,
  importHelpers: true,
  // Preventing Typescript from resolving code may break compilation
  noResolve: false
};
