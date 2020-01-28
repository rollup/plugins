import { PluginContext, RollupLogProps } from 'rollup';

// `Cannot compile modules into 'es6' when targeting 'ES5' or lower.`
const CANNOT_COMPILE_ESM = 1204;

/**
 * For each type error reported by Typescript, emit a Rollup warning or error.
 */
export function emitDiagnostics(
  ts: typeof import('typescript'),
  context: PluginContext,
  host: import('typescript').FormatDiagnosticsHost &
    Pick<import('typescript').LanguageServiceHost, 'getCompilationSettings'>,
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

/**
 * Converts a Typescript type error into an equivalent Rollup warning object.
 */
export function diagnosticToWarning(
  ts: typeof import('typescript'),
  host: import('typescript').FormatDiagnosticsHost | null,
  diagnostic: import('typescript').Diagnostic
) {
  const pluginCode = `TS${diagnostic.code}`;
  const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');

  // Build a Rollup warning object from the diagnostics object.
  const warning: RollupLogProps = {
    pluginCode,
    message: `@rollup/plugin-typescript ${pluginCode}: ${message}`
  };

  if (diagnostic.file) {
    // Add information about the file location
    const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!);

    warning.loc = {
      column: character + 1,
      line: line + 1,
      file: diagnostic.file.fileName
    };

    if (host) {
      // Extract a code frame from Typescript
      const formatted = ts.formatDiagnosticsWithColorAndContext([diagnostic], host);
      // Typescript only exposes this formatter as a string prefixed with the flattened message.
      // We need to remove it here since Rollup treats the properties as separate parts.
      let frame = formatted.slice(formatted.indexOf(message) + message.length);
      const newLine = host.getNewLine();
      if (frame.startsWith(newLine)) {
        frame = frame.slice(frame.indexOf(newLine) + newLine.length);
      }
      warning.frame = frame;
    }
  }

  return warning;
}
