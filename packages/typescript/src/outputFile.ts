import { SourceDescription } from 'rollup';

import TSCache from './tscache';

export interface TypescriptSourceDescription extends Partial<SourceDescription> {
  declarations: string[];
}
export interface TSGeneratedFile {
  data: string;
  sourceFileNames?: string[];
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
 * Returns the content of a filename either from the current
 * typescript compiler instance or from the cached content.
 * @param fileName The filename for the contents to retrieve
 * @param emittedFiles The files emitted in the current typescript instance
 * @param tsCache A cache to files cached by Typescript
 */
export function getEmittedFile(
  fileName: string | undefined,
  emittedFiles: ReadonlyMap<string, TSGeneratedFile>,
  tsCache: TSCache
): string | undefined {
  let code: string | undefined;
  if (fileName) {
    if (emittedFiles.has(fileName)) {
      code = emittedFiles.get(fileName)?.data;
    } else {
      code = tsCache.getCached(fileName);
    }
  }
  return code;
}

/**
 * Finds the corresponding emitted Javascript files for a given Typescript file.
 * @param source Path to the Typescript file.
 * @param emittedFiles Map of file names to source code,
 * containing files emitted by the Typescript compiler.
 */
export default function getTSGeneratedOutput(
  sourceFilename: string,
  tsGeneratedFiles: ReadonlyMap<string, TSGeneratedFile>,
  tsCache: TSCache
): TypescriptSourceDescription {
  // We only want to consider tsGeneratedFiles that have the source listed as one of their inputs.
  const tsGeneratedFileNames: string[] = [];
  tsGeneratedFiles.forEach((tsGeneratedFile: TSGeneratedFile, filename: string) => {
    if (tsGeneratedFile.sourceFileNames?.includes(sourceFilename)) {
      tsGeneratedFileNames.push(filename);
    }
  });

  const codeFilename = tsGeneratedFileNames.find(isCodeOutputFile);
  const mapFilename = tsGeneratedFileNames.find(
    (candidateMapFilename) =>
      codeFilename &&
      isMapOutputFile(candidateMapFilename) &&
      candidateMapFilename.includes(codeFilename)
  );

  return {
    code: getEmittedFile(codeFilename, tsGeneratedFiles, tsCache),
    map: getEmittedFile(mapFilename, tsGeneratedFiles, tsCache),
    declarations: tsGeneratedFileNames.filter(
      (candidateDeclarationFilename) =>
        candidateDeclarationFilename !== codeFilename &&
        candidateDeclarationFilename !== mapFilename
    )
  };
}
