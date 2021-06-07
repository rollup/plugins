import type { CompilerOptions, FormatDiagnosticsHost } from 'typescript';

export interface DiagnosticsHost extends FormatDiagnosticsHost {
  getCompilationSettings(): CompilerOptions;
}

/**
 * Create a format diagnostics host to use with the Typescript type checking APIs.
 * Typescript hosts are used to represent the user's system,
 * with an API for checking case sensitivity etc.
 * @param compilerOptions Typescript compiler options. Affects functions such as `getNewLine`.
 * @see https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API
 */
export default function createFormattingHost(
  ts: typeof import('typescript'),
  compilerOptions: CompilerOptions
): DiagnosticsHost {
  return {
    /** Returns the compiler options for the project. */
    getCompilationSettings: () => compilerOptions,
    /** Returns the current working directory. */
    getCurrentDirectory: () => process.cwd(),
    /** Returns the string that corresponds with the selected `NewLineKind`. */
    getNewLine() {
      switch (compilerOptions.newLine) {
        case ts.NewLineKind.CarriageReturnLineFeed:
          return '\r\n';
        case ts.NewLineKind.LineFeed:
          return '\n';
        default:
          return ts.sys.newLine;
      }
    },
    /** Returns a lower case name on case insensitive systems, otherwise the original name. */
    getCanonicalFileName: (fileName) =>
      ts.sys.useCaseSensitiveFileNames ? fileName : fileName.toLowerCase()
  };
}
