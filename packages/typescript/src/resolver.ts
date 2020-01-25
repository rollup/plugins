type ModuleResolverHost = import('typescript').ModuleResolutionHost &
  Pick<import('typescript').FormatDiagnosticsHost, 'getCanonicalFileName'> &
  Pick<import('typescript').LanguageServiceHost, 'getCompilationSettings'>;

export type Resolver = (
  moduleName: string,
  containingFile: string
) => import('typescript').ResolvedModuleFull | undefined;

/**
 * Create a helper for resolving modules using Typescript.
 */
export default function createModuleResolver(
  ts: typeof import('typescript'),
  host: ModuleResolverHost
): Resolver {
  const compilerOptions = host.getCompilationSettings();
  const cache = ts.createModuleResolutionCache(
    process.cwd(),
    host.getCanonicalFileName,
    compilerOptions
  );

  return (moduleName, containingFile) => {
    const resolved = ts.nodeModuleNameResolver(
      moduleName,
      containingFile,
      compilerOptions,
      host,
      cache
    );
    return resolved.resolvedModule;
  };
}
