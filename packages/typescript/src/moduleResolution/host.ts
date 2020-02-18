export type ModuleResolutionHost = import('typescript').ModuleResolutionHost;

/**
 * Creates a module resolution host to use with the Typescript compiler API.
 * Typescript hosts are used to represent the user's system,
 * with an API for reading files, checking directories and case sensitivity etc.
 * @see https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API
 */
export default function createModuleResolutionHost(
  ts: typeof import('typescript')
): ModuleResolutionHost {
  return {
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
    directoryExists: ts.sys.directoryExists,
    realpath: ts.sys.realpath,
    getDirectories: ts.sys.getDirectories
  };
}
