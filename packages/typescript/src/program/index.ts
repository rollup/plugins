import { DiagnosticsHost } from '../diagnostics/host';
import { Resolver } from '../moduleResolution';

export type BuilderProgram = import('typescript').EmitAndSemanticDiagnosticsBuilderProgram;

export interface CreateProgramOptions {
    /** Formatting host used to get some system functions and emit type errors. */
    formatHost: DiagnosticsHost;
    /** Parsed Typescript compiler options. */
    parsedOptions: import('typescript').ParsedCommandLine;
    /** Callback to save compiled files in memory. */
    writeFile: import('typescript').WriteFileCallback;
    /** Function to resolve a module location */
    resolveModule: Resolver;
  }
