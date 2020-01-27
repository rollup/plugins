import { SourceDescription } from 'rollup';

/**
 * Checks if the given OutputFile represents some code
 */
function isCodeOutputFile(file: import('typescript').OutputFile): boolean {
  return !isMapOutputFile(file) && !file.name.endsWith('.d.ts');
}

/**
 * Checks if the given OutputFile represents some source map
 */
function isMapOutputFile({ name }: import('typescript').OutputFile): boolean {
  return name.endsWith('.map');
}

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
