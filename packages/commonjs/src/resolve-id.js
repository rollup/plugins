/* eslint-disable no-param-reassign, no-undefined */

import { statSync } from 'fs';
import { dirname, resolve, sep } from 'path';

import {
  DYNAMIC_MODULES_ID,
  ENTRY_SUFFIX,
  ES_IMPORT_SUFFIX,
  EXPORTS_SUFFIX,
  EXTERNAL_SUFFIX,
  HELPERS_ID,
  IS_WRAPPED_COMMONJS,
  isWrappedId,
  MODULE_SUFFIX,
  PROXY_SUFFIX,
  unwrapId,
  wrapId,
  WRAPPED_SUFFIX
} from './helpers';

function getCandidatesForExtension(resolved, extension) {
  return [resolved + extension, `${resolved}${sep}index${extension}`];
}

function getCandidates(resolved, extensions) {
  return extensions.reduce(
    (paths, extension) => paths.concat(getCandidatesForExtension(resolved, extension)),
    [resolved]
  );
}

export function resolveExtensions(importee, importer, extensions) {
  // not our problem
  if (importee[0] !== '.' || !importer) return undefined;

  const resolved = resolve(dirname(importer), importee);
  const candidates = getCandidates(resolved, extensions);

  for (let i = 0; i < candidates.length; i += 1) {
    try {
      const stats = statSync(candidates[i]);
      if (stats.isFile()) return { id: candidates[i] };
    } catch (err) {
      /* noop */
    }
  }

  return undefined;
}

export default function getResolveId(extensions) {
  return async function resolveId(importee, importer, resolveOptions) {
    // We assume that all requires are pre-resolved
    const customOptions = resolveOptions.custom;
    if (customOptions && customOptions['node-resolve'] && customOptions['node-resolve'].isRequire) {
      return null;
    }
    if (isWrappedId(importee, WRAPPED_SUFFIX)) {
      return unwrapId(importee, WRAPPED_SUFFIX);
    }

    if (
      importee.endsWith(ENTRY_SUFFIX) ||
      isWrappedId(importee, MODULE_SUFFIX) ||
      isWrappedId(importee, EXPORTS_SUFFIX) ||
      isWrappedId(importee, PROXY_SUFFIX) ||
      isWrappedId(importee, ES_IMPORT_SUFFIX) ||
      isWrappedId(importee, EXTERNAL_SUFFIX) ||
      importee.startsWith(HELPERS_ID) ||
      importee === DYNAMIC_MODULES_ID
    ) {
      return importee;
    }

    if (importer) {
      if (
        importer === DYNAMIC_MODULES_ID ||
        // Proxies are only importing resolved ids, no need to resolve again
        isWrappedId(importer, PROXY_SUFFIX) ||
        isWrappedId(importer, ES_IMPORT_SUFFIX) ||
        importer.endsWith(ENTRY_SUFFIX)
      ) {
        return importee;
      }
      if (isWrappedId(importer, EXTERNAL_SUFFIX)) {
        // We need to return null for unresolved imports so that the proper warning is shown
        if (!(await this.resolve(importee, importer, { skipSelf: true }))) {
          return null;
        }
        // For other external imports, we need to make sure they are handled as external
        return { id: importee, external: true };
      }
    }

    if (importee.startsWith('\0')) {
      return null;
    }

    // If this is an entry point or ESM import, we need to figure out if the importee is wrapped and
    // if that is the case, we need to add a proxy.
    const resolved =
      (await this.resolve(importee, importer, Object.assign({ skipSelf: true }, resolveOptions))) ||
      resolveExtensions(importee, importer, extensions);
    // Make sure that even if other plugins resolve again, we ignore our own proxies
    if (
      !resolved ||
      resolved.external ||
      resolved.id.endsWith(ENTRY_SUFFIX) ||
      isWrappedId(resolved.id, ES_IMPORT_SUFFIX)
    ) {
      return resolved;
    }
    const moduleInfo = await this.load(resolved);
    if (resolveOptions.isEntry) {
      moduleInfo.moduleSideEffects = true;
      // We must not precede entry proxies with a `\0` as that will mess up relative external resolution
      return resolved.id + ENTRY_SUFFIX;
    }
    const {
      meta: { commonjs: commonjsMeta }
    } = moduleInfo;
    if (commonjsMeta && commonjsMeta.isCommonJS === IS_WRAPPED_COMMONJS) {
      return { id: wrapId(resolved.id, ES_IMPORT_SUFFIX), meta: { commonjs: { resolved } } };
    }
    return resolved;
  };
}
