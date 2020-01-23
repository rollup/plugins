import createModuleResolver, { Resolver } from './resolver';

type BaseHost = import('typescript').LanguageServiceHost &
  import('typescript').ModuleResolutionHost &
  import('typescript').FormatDiagnosticsHost;

export interface TypescriptHost extends BaseHost {
  /**
   * Lets the host know about a file by adding it to its memory.
   * @param id Filename
   * @param code Body of the file
   * @see https://blog.scottlogic.com/2015/01/20/typescript-compiler-api.html
   */
  addFile(id: string, code: string): void;
  /**
   * Reads the given file.
   * Used for both `LanguageServiceHost` (2 params) and `ModuleResolutionHost` (1 param).
   */
  readFile(path: string, encoding?: string): string | undefined;
  /**
   * Uses Typescript to resolve a module path.
   * The `compilerOptions` parameter from `LanguageServiceHost.resolveModuleNames`
   * is ignored and omitted in this signature.
   */
  resolveModuleNames(
    moduleNames: string[],
    containingFile: string
  ): Array<import('typescript').ResolvedModuleFull | undefined>;
}

interface File {
  file: import('typescript').IScriptSnapshot;
  version: number;
}

/**
 * Create a language service host to use with the Typescript compiler & type checking APIs.
 * @param parsedOptions Parsed options for Typescript.
 * @param parsedOptions.options Typescript compiler options. Affects functions such as `getNewLine`.
 * @param parsedOptions.fileNames Declaration files to include for typechecking.
 * @see https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API
 */
export default function createHost(
  ts: typeof import('typescript'),
  parsedOptions: import('typescript').ParsedCommandLine
): TypescriptHost {
  const files = new Map<string, File>();

  /** Get the code stored in a File snapshot. */
  function getCode({ file }: File) {
    return file.getText(0, file.getLength());
  }

  /** @see TypescriptHost.addFile */
  function addFile(id: string, code: string) {
    const existing = files.get(id);
    // Don't need to update if nothing changed
    if (existing && getCode(existing) === code) return;

    files.set(id, {
      file: ts.ScriptSnapshot.fromString(code),
      version: existing ? existing.version + 1 : 0
    });
  }

  /** Helper that tries to read the file if it hasn't been stored yet */
  function getFile(id: string) {
    if (!files.has(id)) {
      const code = ts.sys.readFile(id);
      if (code == null) {
        throw new Error(`@rollup/plugin-typescript: Could not find ${id}`);
      }
      addFile(id, code);
    }
    return files.get(id);
  }

  parsedOptions.fileNames.forEach((id) => getFile(id));

  let resolver: Resolver;
  const host: TypescriptHost = {
    getCompilationSettings: () => parsedOptions.options,
    getCurrentDirectory: () => process.cwd(),
    getNewLine: () => getNewLine(ts, parsedOptions.options.newLine),
    getCanonicalFileName: (fileName) =>
      ts.sys.useCaseSensitiveFileNames ? fileName : fileName.toLowerCase(),
    useCaseSensitiveFileNames: () => ts.sys.useCaseSensitiveFileNames,
    getDefaultLibFileName: ts.getDefaultLibFilePath,
    getDirectories: ts.sys.getDirectories,
    directoryExists: ts.sys.directoryExists,
    realpath: ts.sys.realpath,
    readDirectory: ts.sys.readDirectory,
    readFile(fileName, encoding) {
      const file = files.get(fileName);
      if (file != null) return getCode(file);
      return ts.sys.readFile(fileName, encoding);
    },
    fileExists: (fileName) => files.has(fileName) || ts.sys.fileExists(fileName),
    getScriptFileNames: () => Array.from(files.keys()),
    getScriptSnapshot: (fileName) => getFile(fileName).file,
    getScriptVersion: (fileName) => getFile(fileName).version.toString(),
    resolveModuleNames(moduleNames, containingFile) {
      return moduleNames.map((moduleName) => resolver(moduleName, containingFile));
    },
    addFile
  };
  // Declared here because this has a circular reference
  resolver = createModuleResolver(ts, host);

  return host;
}

/**
 * Returns the string that corresponds with the selected `NewLineKind`.
 */
function getNewLine(
  ts: typeof import('typescript'),
  kind: import('typescript').NewLineKind | undefined
) {
  switch (kind) {
    case ts.NewLineKind.CarriageReturnLineFeed:
      return '\r\n';
    case ts.NewLineKind.LineFeed:
      return '\n';
    default:
      return ts.sys.newLine;
  }
}
