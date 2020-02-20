import { PluginContext } from 'rollup';

import { buildDiagnosticReporter } from './diagnostics/emit';
import { DiagnosticsHost } from './diagnostics/host';
import { Resolver } from './moduleResolution';

type BuilderProgram = import('typescript').EmitAndSemanticDiagnosticsBuilderProgram;

interface CreateProgramOptions {
  /** Formatting host used to get some system functions and emit type errors. */
  formatHost: DiagnosticsHost;
  /** Parsed Typescript compiler options. */
  parsedOptions: import('typescript').ParsedCommandLine;
  /** Callback to save compiled files in memory. */
  writeFile: import('typescript').WriteFileCallback;
  /** Function to resolve a module location */
  resolveModule: Resolver;
}

/**
 * Create a language service host to use with the Typescript compiler & type checking APIs.
 * Typescript hosts are used to represent the user's system,
 * with an API for reading files, checking directories and case sensitivity etc.
 * @see https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API
 */
function createWatchHost(
  ts: typeof import('typescript'),
  context: PluginContext,
  { formatHost, parsedOptions, writeFile, resolveModule }: CreateProgramOptions
): import('typescript').WatchCompilerHostOfFilesAndCompilerOptions<BuilderProgram> {
  const createProgram = ts.createEmitAndSemanticDiagnosticsBuilderProgram;

  const baseHost = ts.createWatchCompilerHost(
    parsedOptions.fileNames,
    parsedOptions.options,
    ts.sys,
    createProgram,
    buildDiagnosticReporter(ts, context, formatHost),
    // Ignore watch status changes
    () => {},
    parsedOptions.projectReferences
  );

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
      return moduleNames.map((moduleName) => resolveModule(moduleName, containingFile));
    }
  };
}

export default function createWatchProgram(
  ts: typeof import('typescript'),
  context: PluginContext,
  options: CreateProgramOptions
) {
  return ts.createWatchProgram(createWatchHost(ts, context, options));
}
