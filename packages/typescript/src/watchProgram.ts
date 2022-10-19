import type { PluginContext } from 'rollup';
import typescript from 'typescript';
import type {
  Diagnostic,
  EmitAndSemanticDiagnosticsBuilderProgram,
  ParsedCommandLine,
  WatchCompilerHostOfFilesAndCompilerOptions,
  WatchStatusReporter,
  WriteFileCallback
} from 'typescript';

import type { CustomTransformerFactories } from '../types';

import { buildDiagnosticReporter } from './diagnostics/emit';
import type { DiagnosticsHost } from './diagnostics/host';
import type { Resolver } from './moduleResolution';
import { mergeTransformers } from './customTransformers';

const { DiagnosticCategory } = typescript;
type BuilderProgram = EmitAndSemanticDiagnosticsBuilderProgram;

// @see https://github.com/microsoft/TypeScript/blob/master/src/compiler/diagnosticMessages.json
// eslint-disable-next-line no-shadow
enum DiagnosticCode {
  FILE_CHANGE_DETECTED = 6032,
  FOUND_1_ERROR_WATCHING_FOR_FILE_CHANGES = 6193,
  FOUND_N_ERRORS_WATCHING_FOR_FILE_CHANGES = 6194
}

interface CreateProgramOptions {
  /** Formatting host used to get some system functions and emit type errors. */
  formatHost: DiagnosticsHost;
  /** Parsed Typescript compiler options. */
  parsedOptions: ParsedCommandLine;
  /** Callback to save compiled files in memory. */
  writeFile: WriteFileCallback;
  /** Callback for the Typescript status reporter. */
  status: WatchStatusReporter;
  /** Function to resolve a module location */
  resolveModule: Resolver;
  /** Custom TypeScript transformers */
  transformers?: CustomTransformerFactories;
}

type DeferredResolve = ((value: boolean | PromiseLike<boolean>) => void) | (() => void);

interface Deferred {
  promise: Promise<boolean | void>;
  resolve: DeferredResolve;
}

function createDeferred(timeout?: number): Deferred {
  let promise: Promise<boolean | void>;
  let resolve: DeferredResolve = () => {};

  if (timeout) {
    promise = Promise.race<boolean | void>([
      new Promise((r) => setTimeout(r, timeout, true)),
      new Promise((r) => (resolve = r))
    ]);
  } else {
    promise = new Promise((r) => (resolve = r));
  }

  return { promise, resolve };
}

/**
 * Typescript watch program helper to sync Typescript watch status with Rollup hooks.
 */
export class WatchProgramHelper {
  private _startDeferred: Deferred | null = null;
  private _finishDeferred: Deferred | null = null;

  watch(timeout = 1000) {
    // Race watcher start promise against a timeout in case Typescript and Rollup change detection is not in sync.
    this._startDeferred = createDeferred(timeout);
    this._finishDeferred = createDeferred();
  }

  handleStatus(diagnostic: Diagnostic) {
    // Fullfil deferred promises by Typescript diagnostic message codes.
    if (diagnostic.category === DiagnosticCategory.Message) {
      switch (diagnostic.code) {
        case DiagnosticCode.FILE_CHANGE_DETECTED:
          this.resolveStart();
          break;

        case DiagnosticCode.FOUND_1_ERROR_WATCHING_FOR_FILE_CHANGES:
        case DiagnosticCode.FOUND_N_ERRORS_WATCHING_FOR_FILE_CHANGES:
          this.resolveFinish();
          break;

        default:
      }
    }
  }

  resolveStart() {
    if (this._startDeferred) {
      this._startDeferred.resolve(false);
      this._startDeferred = null;
    }
  }

  resolveFinish() {
    if (this._finishDeferred) {
      this._finishDeferred.resolve(false);
      this._finishDeferred = null;
    }
  }

  async wait() {
    if (this._startDeferred) {
      const timeout = await this._startDeferred.promise;

      // If there is no file change detected by Typescript skip deferred promises.
      if (timeout) {
        this._startDeferred = null;
        this._finishDeferred = null;
      }

      await this._finishDeferred?.promise;
    }
  }
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
  {
    formatHost,
    parsedOptions,
    writeFile,
    status,
    resolveModule,
    transformers
  }: CreateProgramOptions
): WatchCompilerHostOfFilesAndCompilerOptions<BuilderProgram> {
  const createProgram = ts.createEmitAndSemanticDiagnosticsBuilderProgram;

  const baseHost = ts.createWatchCompilerHost(
    parsedOptions.fileNames,
    parsedOptions.options,
    ts.sys,
    createProgram,
    buildDiagnosticReporter(ts, context, formatHost),
    status,
    parsedOptions.projectReferences
  );

  return {
    ...baseHost,
    /** Override the created program so an in-memory emit is used */
    afterProgramCreate(program) {
      const origEmit = program.emit;
      // eslint-disable-next-line no-param-reassign
      program.emit = (targetSourceFile, _, ...args) =>
        origEmit(
          targetSourceFile,
          writeFile,
          // cancellationToken
          args[0],
          // emitOnlyDtsFiles
          args[1],
          mergeTransformers(program, transformers, args[2] as CustomTransformerFactories)
        );

      return baseHost.afterProgramCreate!(program);
    },
    /** Add helper to deal with module resolution */
    resolveModuleNames(
      moduleNames,
      containingFile,
      _reusedNames,
      redirectedReference,
      _optionsOnlyWithNewerTsVersions,
      containingSourceFile
    ) {
      return moduleNames.map((moduleName, i) => {
        const mode = containingSourceFile
          ? ts.getModeForResolutionAtIndex?.(containingSourceFile, i)
          : undefined; // eslint-disable-line no-undefined

        return resolveModule(moduleName, containingFile, redirectedReference, mode);
      });
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
