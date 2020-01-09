import { PluginContext, RollupLogProps } from 'rollup';

// `Cannot compile modules into 'es6' when targeting 'ES5' or lower.`
const CANNOT_COMPILE_ESM = 1204;

/**
 * For each type error reported by Typescript, emit a Rollup warning or error.
 */
export function emitDiagnostics(
  ts: typeof import('typescript'),
  context: PluginContext,
  diagnostics: readonly import('typescript').Diagnostic[] | undefined
) {
  if (!diagnostics) return;

  diagnostics
    .filter((diagnostic) => diagnostic.code !== CANNOT_COMPILE_ESM)
    .forEach((diagnostic) => {
      // Build a Rollup warning object from the diagnostics object.
      const warning = diagnosticToWarning(ts, diagnostic);

      // Errors are fatal. Otherwise emit warnings.
      if (diagnostic.category === ts.DiagnosticCategory.Error) {
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
  diagnostic: import('typescript').Diagnostic
) {
  const pluginCode = `TS${diagnostic.code}`;
  const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');

  // Build a Rollup warning object from the diagnostics object.
  const warning: RollupLogProps = {
    pluginCode,
    message: `@rollup/plugin-typescript ${pluginCode}: ${message}`
  };

  // Add information about the file location
  if (diagnostic.file) {
    const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);

    warning.loc = {
      column: character + 1,
      line: line + 1,
      file: diagnostic.file.fileName
    };
  }

  return warning;
}
