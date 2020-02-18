import { SourceDescription } from 'rollup';

import { isCodeOutputFile, isMapOutputFile } from './isFile';

/**
 * Transforms a Typescript EmitOutput into a Rollup SourceDescription.
 */
export default function typescriptOutputToRollupTransformation(
  outputFiles: readonly import('typescript').OutputFile[]
): SourceDescription | null {
  const code = outputFiles.find(isCodeOutputFile);
  if (code == null) return null;
  const map = outputFiles.find(isMapOutputFile);

  return {
    code: code.text,
    map: map?.text
  };
}
