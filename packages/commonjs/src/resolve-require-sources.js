import {
  EXTERNAL_SUFFIX,
  IS_WRAPPED_COMMONJS,
  PROXY_SUFFIX,
  wrapId,
  WRAPPED_SUFFIX
} from './helpers';
import { resolveExtensions } from './resolve-id';

export function getResolveRequireSourcesAndGetMeta(extensions, detectCyclesAndConditional) {
  const knownCjsModuleTypes = Object.create(null);
  const requiredIds = Object.create(null);
  const unconditionallyRequiredIds = Object.create(null);
  const dependencies = Object.create(null);
  const getDependencies = (id) => dependencies[id] || (dependencies[id] = new Set());

  const isCyclic = (id) => {
    const dependenciesToCheck = new Set(getDependencies(id));
    for (const dependency of dependenciesToCheck) {
      if (dependency === id) {
        return true;
      }
      for (const childDependency of getDependencies(dependency)) {
        dependenciesToCheck.add(childDependency);
      }
    }
    return false;
  };

  const fullyAnalyzedModules = Object.create(null);

  const getTypeForFullyAnalyzedModule = (id) => {
    const knownType = knownCjsModuleTypes[id];
    if (
      knownType === IS_WRAPPED_COMMONJS ||
      !detectCyclesAndConditional ||
      fullyAnalyzedModules[id]
    ) {
      return knownType;
    }
    fullyAnalyzedModules[id] = true;
    if (isCyclic(id)) {
      return (knownCjsModuleTypes[id] = IS_WRAPPED_COMMONJS);
    }
    return knownType;
  };

  return {
    getWrappedIds: () =>
      Object.keys(knownCjsModuleTypes).filter(
        (id) => knownCjsModuleTypes[id] === IS_WRAPPED_COMMONJS
      ),
    isRequiredId: (id) => requiredIds[id],
    resolveRequireSourcesAndGetMeta: (rollupContext) => async (
      parentId,
      isParentCommonJS,
      sources
    ) => {
      knownCjsModuleTypes[parentId] = isParentCommonJS;
      if (
        detectCyclesAndConditional &&
        knownCjsModuleTypes[parentId] &&
        requiredIds[parentId] &&
        !unconditionallyRequiredIds[parentId]
      ) {
        knownCjsModuleTypes[parentId] = IS_WRAPPED_COMMONJS;
      }
      const requireTargets = await Promise.all(
        sources.map(async ({ source, isConditional }) => {
          // Never analyze or proxy internal modules
          if (source.startsWith('\0')) {
            return { id: source, allowProxy: false };
          }
          const resolved =
            (await rollupContext.resolve(source, parentId, {
              custom: { 'node-resolve': { isRequire: true } }
            })) || resolveExtensions(source, parentId, extensions);
          if (!resolved) {
            return { id: wrapId(source, EXTERNAL_SUFFIX), allowProxy: false };
          }
          const childId = resolved.id;
          if (resolved.external) {
            return { id: wrapId(childId, EXTERNAL_SUFFIX), allowProxy: false };
          }
          requiredIds[childId] = true;
          if (!(isConditional || knownCjsModuleTypes[parentId] === IS_WRAPPED_COMMONJS)) {
            unconditionallyRequiredIds[childId] = true;
          }

          getDependencies(parentId).add(childId);
          if (!isCyclic(childId)) {
            // This makes sure the current transform handler waits for all direct dependencies to be
            // loaded and transformed and therefore for all transitive CommonJS dependencies to be
            // loaded as well so that all cycles have been found and knownCjsModuleTypes is reliable.
            await rollupContext.load(resolved);
          } else if (detectCyclesAndConditional && knownCjsModuleTypes[parentId]) {
            knownCjsModuleTypes[parentId] = IS_WRAPPED_COMMONJS;
          }
          return { id: childId, allowProxy: true };
        })
      );
      return {
        requireTargets: requireTargets.map(({ id: dependencyId, allowProxy }, index) => {
          const isCommonJS = getTypeForFullyAnalyzedModule(dependencyId);
          return {
            source: sources[index].source,
            id: allowProxy
              ? isCommonJS === IS_WRAPPED_COMMONJS
                ? wrapId(dependencyId, WRAPPED_SUFFIX)
                : wrapId(dependencyId, PROXY_SUFFIX)
              : dependencyId,
            isCommonJS
          };
        }),
        usesRequireWrapper: getTypeForFullyAnalyzedModule(parentId) === IS_WRAPPED_COMMONJS
      };
    }
  };
}
