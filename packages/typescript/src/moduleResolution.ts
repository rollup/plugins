import type {
  ModuleResolutionHost,
  ResolvedModuleFull,
  ResolvedProjectReference,
  ModuleKind
} from 'typescript';

import type { DiagnosticsHost } from './diagnostics/host';

type ModuleResolverHost = Partial<ModuleResolutionHost> & DiagnosticsHost;

export type Resolver = (
  moduleName: string,
  containingFile: string,
  redirectedReference?: ResolvedProjectReference | undefined,
  mode?: ModuleKind.ESNext | ModuleKind.CommonJS | undefined
) => ResolvedModuleFull | undefined;

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
  const moduleHost = { ...ts.sys, ...host };

  return (moduleName, containingFile, redirectedReference, mode) => {
    const resolved = ts.resolveModuleName(
      moduleName,
      containingFile,
      compilerOptions,
      moduleHost,
      cache,
      redirectedReference,
      mode
    );
    return resolved.resolvedModule;
  };
}
