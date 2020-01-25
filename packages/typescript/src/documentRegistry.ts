/**
 * Map of Typescript instances to paths to DocumentRegistries.
 */
const globalRegistryCache = new Map<
  typeof import('typescript'),
  Map<string, import('typescript').DocumentRegistry>
>();

/**
 * Return a `DocumentRegistry` instance that matches the given Typescript instance
 * and working directory. If there is no a pre-existing instance, one will be
 * created and set in the map.
 */
export default function getDocumentRegistry(ts: typeof import('typescript'), cwd: string) {
  if (!globalRegistryCache.has(ts)) {
    globalRegistryCache.set(ts, new Map());
  }
  const instanceRegistryCache = globalRegistryCache.get(ts);
  if (!instanceRegistryCache.has(cwd)) {
    instanceRegistryCache.set(
      cwd,
      ts.createDocumentRegistry(ts.sys.useCaseSensitiveFileNames, cwd)
    );
  }
  return instanceRegistryCache.get(cwd)!;
}
