import { SourceDescription } from 'rollup';

export interface TypescriptSourceDescription extends Partial<SourceDescription> {
  declarations: string[];
}

/**
 * Checks if the given OutputFile represents some code
 */
function isCodeOutputFile(name: string): boolean {
  return !isMapOutputFile(name) && !name.endsWith('.d.ts');
}

/**
 * Checks if the given OutputFile represents some source map
 */
function isMapOutputFile(name: string): boolean {
  return name.endsWith('.map');
}

/**
 * Finds the corresponding emitted Javascript files for a given Typescript file.
 * @param id Path to the Typescript file.
 * @param emittedFiles Map of file names to source code,
 * containing files emitted by the Typescript compiler.
 */
export default function findTypescriptOutput(
  ts: typeof import('typescript'),
  parsedOptions: import('typescript').ParsedCommandLine,
  id: string,
  emittedFiles: ReadonlyMap<string, string>
): TypescriptSourceDescription {
  const emittedFileNames = ts.getOutputFileNames(
    parsedOptions,
    id,
    !ts.sys.useCaseSensitiveFileNames
  );

  const codeFile = emittedFileNames.find(isCodeOutputFile);
  const mapFile = emittedFileNames.find(isMapOutputFile);

  return {
    code: emittedFiles.get(codeFile!),
    map: emittedFiles.get(mapFile!),
    declarations: emittedFileNames.filter((name) => name !== codeFile && name !== mapFile)
  };
}
