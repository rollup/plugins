import type typescript from 'typescript';
import type {
  ModuleResolutionHost,
  ResolvedModuleFull,
  ResolvedProjectReference,
  ModuleKind
} from 'typescript';
import type { CreateFilter } from '@rollup/pluginutils';

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
  ts: typeof typescript,
  host: ModuleResolverHost,
  filter: ReturnType<CreateFilter>
): Resolver {
  const compilerOptions = host.getCompilationSettings();
  const cache = ts.createModuleResolutionCache(
    process.cwd(),
    host.getCanonicalFileName,
    compilerOptions
  );
  const moduleHost = { ...ts.sys, ...host };

  return (moduleName, containingFile, redirectedReference, mode) => {
    const { resolvedModule } = ts.resolveModuleName(
      moduleName,
      containingFile,
      compilerOptions,
      moduleHost,
      cache,
      redirectedReference,
      mode
    );
    /**
     * If the module's path contains 'node_modules', ts considers it an external library and refuses to compile it,
     * so we have to change the value of `isExternalLibraryImport` to false if it's true
     * */
    if (resolvedModule?.isExternalLibraryImport && filter(resolvedModule?.resolvedFileName)) {
      resolvedModule.isExternalLibraryImport = false;
    }
    return resolvedModule;
  };
}
