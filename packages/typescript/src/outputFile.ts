import { EmittedAsset, SourceDescription } from 'rollup';

const TS_EXTENSION = /\.tsx?$/;

/**
 * Variant of `SourceDescription` with extra properties for Typescript declaration files.
 */
export interface TypescriptSourceDescription extends SourceDescription {
  declarations: EmittedAsset[];
}

/**
 * Finds the corresponding emitted Javascript files for a given Typescript file.
 * @param id Path to the Typescript file.
 * @param emittedFiles Map of file names to source code,
 * containing files emitted by the Typescript compiler.
 */
export default function findTypescriptOutput(
  id: string,
  emittedFiles: ReadonlyMap<string, string>
): TypescriptSourceDescription | null {
  const code = emittedFiles.get(id.replace(TS_EXTENSION, '.js'));
  if (!code) return null;

  const declarations = ['.d.ts', '.d.ts.map']
    .map((ext) => getDeclaration(id.replace(TS_EXTENSION, ext), emittedFiles))
    .filter(notNull);

  return {
    code,
    map: emittedFiles.get(id.replace(TS_EXTENSION, '.map')),
    declarations
  };
}

function getDeclaration(
  fileName: string,
  emittedFiles: ReadonlyMap<string, string>
): EmittedAsset | null {
  const source = emittedFiles.get(fileName);
  if (!source) return null;

  return {
    type: 'asset',
    fileName,
    source
  };
}

function notNull<T>(obj: T | null): obj is T {
  return obj != null;
}
