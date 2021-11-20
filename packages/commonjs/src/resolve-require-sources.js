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
  const dependentModules = Object.create(null);
  const getDependentModules = (id) =>
    dependentModules[id] || (dependentModules[id] = Object.create(null));

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
      knownCjsModuleTypes[parentId] = knownCjsModuleTypes[parentId] || isParentCommonJS;
      if (
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
              custom: {
                'node-resolve': { isRequire: true }
              }
            })) || resolveExtensions(source, parentId, extensions);
          if (!resolved) {
            return { id: wrapId(source, EXTERNAL_SUFFIX), allowProxy: false };
          }
          const childId = resolved.id;
          if (resolved.external) {
            return { id: wrapId(childId, EXTERNAL_SUFFIX), allowProxy: false };
          }
          requiredIds[childId] = true;
          if (
            !(
              detectCyclesAndConditional &&
              (isConditional || knownCjsModuleTypes[parentId] === IS_WRAPPED_COMMONJS)
            )
          ) {
            unconditionallyRequiredIds[childId] = true;
          }
          const parentDependentModules = getDependentModules(parentId);
          const childDependentModules = getDependentModules(childId);
          childDependentModules[parentId] = true;
          for (const dependentId of Object.keys(parentDependentModules)) {
            childDependentModules[dependentId] = true;
          }
          if (parentDependentModules[childId]) {
            // If we depend on one of our dependencies, we have a cycle. Then all modules that
            // we depend on that also depend on the same module are part of a cycle as well.
            if (detectCyclesAndConditional && isParentCommonJS) {
              knownCjsModuleTypes[parentId] = IS_WRAPPED_COMMONJS;
              knownCjsModuleTypes[childId] = IS_WRAPPED_COMMONJS;
              for (const dependentId of Object.keys(parentDependentModules)) {
                if (getDependentModules(dependentId)[childId]) {
                  knownCjsModuleTypes[dependentId] = IS_WRAPPED_COMMONJS;
                }
              }
            }
          } else {
            // This makes sure the current transform handler waits for all direct dependencies to be
            // loaded and transformed and therefore for all transitive CommonJS dependencies to be
            // loaded as well so that all cycles have been found and knownCjsModuleTypes is reliable.
            await rollupContext.load(resolved);
          }
          return { id: childId, allowProxy: true };
        })
      );
      return {
        requireTargets: requireTargets.map(({ id: dependencyId, allowProxy }, index) => {
          const isCommonJS = knownCjsModuleTypes[dependencyId];
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
        usesRequireWrapper: knownCjsModuleTypes[parentId] === IS_WRAPPED_COMMONJS
      };
    }
  };
}
