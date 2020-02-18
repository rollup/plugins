import { RollupLogProps } from 'rollup';

/**
 * Converts a Typescript type error into an equivalent Rollup warning object.
 */
export default function diagnosticToWarning(
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
