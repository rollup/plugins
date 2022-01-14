import {
  EXTERNAL_SUFFIX,
  IS_WRAPPED_COMMONJS,
  PROXY_SUFFIX,
  wrapId,
  WRAPPED_SUFFIX
} from './helpers';
import { resolveExtensions } from './resolve-id';

export function getRequireResolver(extensions, detectCyclesAndConditional) {
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
    if (knownType !== true || !detectCyclesAndConditional || fullyAnalyzedModules[id]) {
      return knownType;
    }
    fullyAnalyzedModules[id] = true;
    if (isCyclic(id)) {
      return (knownCjsModuleTypes[id] = IS_WRAPPED_COMMONJS);
    }
    return knownType;
  };

  const setInitialParentType = (id, initialCommonJSType) => {
    // It is possible a transformed module is already fully analyzed when using
    // the cache and one dependency introduces a new cycle. Then transform is
    // run for a fully analzyed module again. Fully analyzed modules may never
    // change their type as importers already trust their type.
    knownCjsModuleTypes[id] = fullyAnalyzedModules[id]
      ? knownCjsModuleTypes[id]
      : initialCommonJSType;
    if (
      detectCyclesAndConditional &&
      knownCjsModuleTypes[id] === true &&
      requiredIds[id] &&
      !unconditionallyRequiredIds[id]
    ) {
      knownCjsModuleTypes[id] = IS_WRAPPED_COMMONJS;
    }
  };

  const setTypesForRequiredModules = async (parentId, resolved, isConditional, loadModule) => {
    const childId = resolved.id;
    requiredIds[childId] = true;
    if (!(isConditional || knownCjsModuleTypes[parentId] === IS_WRAPPED_COMMONJS)) {
      unconditionallyRequiredIds[childId] = true;
    }

    getDependencies(parentId).add(childId);
    if (!isCyclic(childId)) {
      // This makes sure the current transform handler waits for all direct dependencies to be
      // loaded and transformed and therefore for all transitive CommonJS dependencies to be
      // loaded as well so that all cycles have been found and knownCjsModuleTypes is reliable.
      await loadModule(resolved);
    }
  };

  return {
    getWrappedIds: () =>
      Object.keys(knownCjsModuleTypes).filter(
        (id) => knownCjsModuleTypes[id] === IS_WRAPPED_COMMONJS
      ),
    isRequiredId: (id) => requiredIds[id],
    async shouldTransformCachedModule({ id: parentId, meta: { commonjs: parentMeta } }) {
      // Ignore modules that did not pass through the original transformer in a previous build
      if (!(parentMeta && parentMeta.requires)) {
        return false;
      }
      setInitialParentType(parentId, parentMeta.initialCommonJSType);
      await Promise.all(
        parentMeta.requires.map(({ resolved, isConditional }) =>
          setTypesForRequiredModules(parentId, resolved, isConditional, this.load)
        )
      );
      if (getTypeForFullyAnalyzedModule(parentId) !== parentMeta.isCommonJS) {
        return true;
      }
      for (const {
        resolved: { id }
      } of parentMeta.requires) {
        if (getTypeForFullyAnalyzedModule(id) !== parentMeta.isRequiredCommonJS[id]) {
          return true;
        }
      }
      return false;
    },
    /* eslint-disable no-param-reassign */
    resolveRequireSourcesAndUpdateMeta: (rollupContext) => async (
      parentId,
      isParentCommonJS,
      parentMeta,
      sources
    ) => {
      parentMeta.initialCommonJSType = isParentCommonJS;
      parentMeta.requires = [];
      parentMeta.isRequiredCommonJS = Object.create(null);
      setInitialParentType(parentId, isParentCommonJS);
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
          parentMeta.requires.push({ resolved, isConditional });
          await setTypesForRequiredModules(parentId, resolved, isConditional, rollupContext.load);
          return { id: childId, allowProxy: true };
        })
      );
      parentMeta.isCommonJS = getTypeForFullyAnalyzedModule(parentId);
      return requireTargets.map(({ id: dependencyId, allowProxy }, index) => {
        // eslint-disable-next-line no-multi-assign
        const isCommonJS = (parentMeta.isRequiredCommonJS[
          dependencyId
        ] = getTypeForFullyAnalyzedModule(dependencyId));
        return {
          source: sources[index].source,
          id: allowProxy
            ? isCommonJS === IS_WRAPPED_COMMONJS
              ? wrapId(dependencyId, WRAPPED_SUFFIX)
              : wrapId(dependencyId, PROXY_SUFFIX)
            : dependencyId,
          isCommonJS
        };
      });
    }
  };
}
