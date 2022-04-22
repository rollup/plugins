import { RollupLogProps } from 'rollup';
import type { Diagnostic, FormatDiagnosticsHost } from 'typescript';

/**
 * Converts a Typescript type error into an equivalent Rollup warning object.
 */
export default function diagnosticToWarning(
  ts: typeof import('typescript'),
  host: FormatDiagnosticsHost | null,
  diagnostic: Diagnostic
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
    const { fileName } = diagnostic.file;

    warning.loc = {
      column: character + 1,
      line: line + 1,
      file: fileName
    };

    warning.message = `${fileName} (${line + 1},${character + 1}): ${warning.message}`;

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
