import { PluginContext } from 'rollup';

import { DiagnosticsHost } from './diagnostics/host';
import createModuleResolver from './moduleResolution/resolver';
import emitDiagnostics from './diagnostics/emit';

type BaseHost = import('typescript').WatchCompilerHostOfFilesAndCompilerOptions<
  import('typescript').EmitAndSemanticDiagnosticsBuilderProgram
>;

export interface WatchCompilerHost extends BaseHost {
  /**
   * Uses Typescript to resolve a module path.
   * The `compilerOptions` parameter from `LanguageServiceHost.resolveModuleNames`
   * is ignored and omitted in this signature.
   */
  resolveModuleNames(
    moduleNames: string[],
    containingFile: string
  ): Array<import('typescript').ResolvedModuleFull | undefined>;
}

interface CreateWatchHostOptions {
  /** Formatting host used to get some system functions and emit type errors. */
  formatHost: DiagnosticsHost;
  /** Typescript compiler options. */
  compilerOptions: import('typescript').CompilerOptions;
  /** List of Typescript files that should be compiled. */
  fileNames: string[];
  /** Callback to save compiled files in memory. */
  writeFile: import('typescript').WriteFileCallback;
}

/**
 * Create a language service host to use with the Typescript compiler & type checking APIs.
 * Typescript hosts are used to represent the user's system,
 * with an API for reading files, checking directories and case sensitivity etc.
 * @see https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API
 */
export default function createWatchHost(
  ts: typeof import('typescript'),
  context: PluginContext,
  { formatHost, compilerOptions, fileNames, writeFile }: CreateWatchHostOptions
): WatchCompilerHost {
  const createProgram = ts.createEmitAndSemanticDiagnosticsBuilderProgram;

  const baseHost = ts.createWatchCompilerHost(
    fileNames,
    compilerOptions,
    ts.sys,
    createProgram,
    // Use Rollup to report diagnostics from Typescript
    (diagnostic) => emitDiagnostics(ts, context, formatHost, [diagnostic]),
    // Ignore watch status changes
    () => {}
  );

  const resolver = createModuleResolver(ts, { ...formatHost, ...baseHost });
  return {
    ...baseHost,
    /** Override the created program so an in-memory emit is used */
    afterProgramCreate(program) {
      const origEmit = program.emit;
      // eslint-disable-next-line no-param-reassign
      program.emit = (targetSourceFile, _, ...args) =>
        origEmit(targetSourceFile, writeFile, ...args);
      return baseHost.afterProgramCreate!(program);
    },
    /** Add helper to deal with module resolution */
    resolveModuleNames(moduleNames, containingFile) {
      return moduleNames.map((moduleName) => resolver(moduleName, containingFile));
    }
  };
}
