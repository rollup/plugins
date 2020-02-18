import { DiagnosticsHost } from '../diagnostics/host';

type ModuleResolutionHost = import('typescript').ModuleResolutionHost;
type ModuleResolverHost = ModuleResolutionHost & DiagnosticsHost;

export type Resolver = (
  moduleName: string,
  containingFile: string
) => import('typescript').ResolvedModuleFull | undefined;

/**
 * Create a helper for resolving modules using Typescript.
 * @param host Typescript host that extends `ModuleResolutionHost`
 * with methods for sanitizing filenames and getting compiler options.
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
