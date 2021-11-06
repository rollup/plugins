import { EXTERNAL_SUFFIX, IS_WRAPPED_COMMONJS, PROXY_SUFFIX, wrapId } from './helpers';
import { resolveExtensions } from './resolve-id';

// TODO Lukas auto-detect circular dependencies
// * only return once all dependencies have been analyzed
// * wait for this.load dependencies unless they already have an entry in knownCjsModuleTypes to avoid deadlocks
//   as those have already started being processed
// * only analyze cycles if we do not have an explicit config
export function getResolveRequireSourcesAndGetMeta(extensions) {
  const knownCjsModuleTypes = Object.create(null);
  return (rollupContext) => (id, isParentCommonJS, sources) => {
    knownCjsModuleTypes[id] = isParentCommonJS;
    return Promise.all(
      sources.map(async (source) => {
        // Never analyze or proxy internal modules
        if (source.startsWith('\0')) {
          return { source, id: source, isCommonJS: false };
        }
        const resolved =
          (await rollupContext.resolve(source, id, {
            skipSelf: true,
            custom: {
              'node-resolve': { isRequire: true }
            }
          })) || resolveExtensions(source, id, extensions);
        if (!resolved) {
          return { source, id: wrapId(source, EXTERNAL_SUFFIX), isCommonJS: false };
        }
        if (resolved.external) {
          return { source, id: wrapId(resolved.id, EXTERNAL_SUFFIX), isCommonJS: false };
        }
        if (resolved.id in knownCjsModuleTypes) {
          return {
            source,
            id:
              knownCjsModuleTypes[resolved.id] === IS_WRAPPED_COMMONJS
                ? resolved.id
                : wrapId(resolved.id, PROXY_SUFFIX),
            isCommonJS: knownCjsModuleTypes[resolved.id]
          };
        }
        const {
          meta: { commonjs: commonjsMeta }
        } = await rollupContext.load(resolved);
        const isCommonJS = commonjsMeta && commonjsMeta.isCommonJS;
        return {
          source,
          id: isCommonJS === IS_WRAPPED_COMMONJS ? resolved.id : wrapId(resolved.id, PROXY_SUFFIX),
          isCommonJS
        };
      })
    );
  };
}
