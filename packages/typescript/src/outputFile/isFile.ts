type OutputFile = import('typescript').OutputFile;

/**
 * Checks if the given OutputFile represents some code
 */
export function isCodeOutputFile(file: OutputFile): boolean {
  return !isMapOutputFile(file) && !file.name.endsWith('.d.ts');
}

/**
 * Checks if the given OutputFile represents some source map
 */
export function isMapOutputFile({ name }: OutputFile): boolean {
  return name.endsWith('.map');
}
