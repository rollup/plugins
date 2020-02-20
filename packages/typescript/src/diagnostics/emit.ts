import { PluginContext } from 'rollup';

import { DiagnosticsHost } from './host';
import diagnosticToWarning from './toWarning';

// `Cannot compile modules into 'es6' when targeting 'ES5' or lower.`
const CANNOT_COMPILE_ESM = 1204;

/**
 * For each type error reported by Typescript, emit a Rollup warning or error.
 */
export default function emitDiagnostics(
  ts: typeof import('typescript'),
  context: PluginContext,
  host: DiagnosticsHost,
  diagnostics: readonly import('typescript').Diagnostic[] | undefined
) {
  if (!diagnostics) return;
  const { noEmitOnError } = host.getCompilationSettings();

  diagnostics
    .filter((diagnostic) => diagnostic.code !== CANNOT_COMPILE_ESM)
    .forEach((diagnostic) => {
      // Build a Rollup warning object from the diagnostics object.
      const warning = diagnosticToWarning(ts, host, diagnostic);

      // Errors are fatal. Otherwise emit warnings.
      if (noEmitOnError && diagnostic.category === ts.DiagnosticCategory.Error) {
        context.error(warning);
      } else {
        context.warn(warning);
      }
    });
}
