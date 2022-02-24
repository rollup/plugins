import {
  ES_IMPORT_SUFFIX,
  EXTERNAL_SUFFIX,
  IS_WRAPPED_COMMONJS,
  isWrappedId,
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

  // Once a module is listed here, its type (wrapped or not) is fixed and may
  // not change for the rest of the current build, to not break already
  // transformed modules.
  const fullyAnalyzedModules = Object.create(null);

  const getTypeForFullyAnalyzedModule = (id) => {
    const knownType = knownCjsModuleTypes[id];
    if (knownType !== true || !detectCyclesAndConditional || fullyAnalyzedModules[id]) {
      return knownType;
    }
    if (isCyclic(id)) {
      return (knownCjsModuleTypes[id] = IS_WRAPPED_COMMONJS);
    }
    return knownType;
  };

  const setInitialParentType = (id, initialCommonJSType) => {
    // Fully analyzed modules may never change type
    if (fullyAnalyzedModules[id]) {
      return;
    }
    knownCjsModuleTypes[id] = initialCommonJSType;
    if (
      detectCyclesAndConditional &&
      knownCjsModuleTypes[id] === true &&
      requiredIds[id] &&
      !unconditionallyRequiredIds[id]
    ) {
      knownCjsModuleTypes[id] = IS_WRAPPED_COMMONJS;
    }
  };

  const analyzeRequiredModule = async (parentId, resolved, isConditional, loadModule) => {
    const childId = resolved.id;
    requiredIds[childId] = true;
    if (!(isConditional || knownCjsModuleTypes[parentId] === IS_WRAPPED_COMMONJS)) {
      unconditionallyRequiredIds[childId] = true;
    }

    getDependencies(parentId).add(childId);
    if (!isCyclic(childId)) {
      // This makes sure the current transform handler waits for all direct
      // dependencies to be loaded and transformed and therefore for all
      // transitive CommonJS dependencies to be loaded as well so that all
      // cycles have been found and knownCjsModuleTypes is reliable.
      await loadModule(resolved);
    }
  };

  const getTypeForImportedModule = async (resolved, loadModule) => {
    if (resolved.id in knownCjsModuleTypes) {
      // This handles cyclic ES dependencies
      return knownCjsModuleTypes[resolved.id];
    }
    const {
      meta: { commonjs }
    } = await loadModule(resolved);
    return (commonjs && commonjs.isCommonJS) || false;
  };

  return {
    getWrappedIds: () =>
      Object.keys(knownCjsModuleTypes).filter(
        (id) => knownCjsModuleTypes[id] === IS_WRAPPED_COMMONJS
      ),
    isRequiredId: (id) => requiredIds[id],
    async shouldTransformCachedModule({
      id: parentId,
      resolvedSources,
      meta: { commonjs: parentMeta }
    }) {
      // We explicitly track ES modules to handle circular imports
      if (!(parentMeta && parentMeta.isCommonJS)) knownCjsModuleTypes[parentId] = false;
      if (isWrappedId(parentId, ES_IMPORT_SUFFIX)) return false;
      const parentRequires = parentMeta && parentMeta.requires;
      if (parentRequires) {
        setInitialParentType(parentId, parentMeta.initialCommonJSType);
        await Promise.all(
          parentRequires.map(({ resolved, isConditional }) =>
            analyzeRequiredModule(parentId, resolved, isConditional, this.load)
          )
        );
        if (getTypeForFullyAnalyzedModule(parentId) !== parentMeta.isCommonJS) {
          return true;
        }
        for (const {
          resolved: { id }
        } of parentRequires) {
          if (getTypeForFullyAnalyzedModule(id) !== parentMeta.isRequiredCommonJS[id]) {
            return true;
          }
        }
        // Now that we decided to go with the cached copy, neither the parent
        // module nor any of its children may change types anymore
        fullyAnalyzedModules[parentId] = true;
        for (const {
          resolved: { id }
        } of parentRequires) {
          fullyAnalyzedModules[id] = true;
        }
      }
      const parentRequireSet = new Set((parentRequires || []).map(({ resolved: { id } }) => id));
      return (
        await Promise.all(
          Object.keys(resolvedSources)
            .map((source) => resolvedSources[source])
            .filter(({ id, external }) => !(external || parentRequireSet.has(id)))
            .map(async (resolved) => {
              if (isWrappedId(resolved.id, ES_IMPORT_SUFFIX)) {
                return (
                  (await getTypeForImportedModule(
                    (await this.load({ id: resolved.id })).meta.commonjs.resolved,
                    this.load
                  )) !== IS_WRAPPED_COMMONJS
                );
              }
              return (await getTypeForImportedModule(resolved, this.load)) === IS_WRAPPED_COMMONJS;
            })
        )
      ).some((shouldTransform) => shouldTransform);
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
          await analyzeRequiredModule(parentId, resolved, isConditional, rollupContext.load);
          return { id: childId, allowProxy: true };
        })
      );
      parentMeta.isCommonJS = getTypeForFullyAnalyzedModule(parentId);
      fullyAnalyzedModules[parentId] = true;
      return requireTargets.map(({ id: dependencyId, allowProxy }, index) => {
        // eslint-disable-next-line no-multi-assign
        const isCommonJS = (parentMeta.isRequiredCommonJS[
          dependencyId
        ] = getTypeForFullyAnalyzedModule(dependencyId));
        fullyAnalyzedModules[dependencyId] = true;
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
