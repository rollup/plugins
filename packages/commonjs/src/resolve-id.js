/* eslint-disable no-param-reassign, no-undefined */

import { statSync } from 'fs';
import { dirname, resolve, sep } from 'path';

import {
  DYNAMIC_JSON_PREFIX,
  DYNAMIC_PACKAGES_ID,
  DYNAMIC_REGISTER_SUFFIX,
  EXPORTS_SUFFIX,
  EXTERNAL_SUFFIX,
  HELPERS_ID,
  isWrappedId,
  MODULE_SUFFIX,
  PROXY_SUFFIX,
  unwrapId,
  wrapId
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

export default function getResolveId(extensions) {
  function resolveExtensions(importee, importer) {
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

  return function resolveId(importee, rawImporter, resolveOptions) {
    if (isWrappedId(importee, MODULE_SUFFIX) || isWrappedId(importee, EXPORTS_SUFFIX)) {
      return importee;
    }

    const importer =
      rawImporter && isWrappedId(rawImporter, DYNAMIC_REGISTER_SUFFIX)
        ? unwrapId(rawImporter, DYNAMIC_REGISTER_SUFFIX)
        : rawImporter;

    // Except for exports, proxies are only importing resolved ids,
    // no need to resolve again
    if (importer && isWrappedId(importer, PROXY_SUFFIX)) {
      return importee;
    }

    const isProxyModule = isWrappedId(importee, PROXY_SUFFIX);
    let isModuleRegistration = false;

    if (isProxyModule) {
      importee = unwrapId(importee, PROXY_SUFFIX);
    } else {
      isModuleRegistration = isWrappedId(importee, DYNAMIC_REGISTER_SUFFIX);
      if (isModuleRegistration) {
        importee = unwrapId(importee, DYNAMIC_REGISTER_SUFFIX);
      }
    }

    if (
      importee.startsWith(HELPERS_ID) ||
      importee === DYNAMIC_PACKAGES_ID ||
      importee.startsWith(DYNAMIC_JSON_PREFIX)
    ) {
      return importee;
    }

    if (importee.startsWith('\0')) {
      return null;
    }

    return this.resolve(
      importee,
      importer,
      Object.assign({}, resolveOptions, {
        skipSelf: true,
        custom: Object.assign({}, resolveOptions.custom, {
          'node-resolve': { isRequire: isProxyModule || isModuleRegistration }
        })
      })
    ).then((resolved) => {
      if (!resolved) {
        resolved = resolveExtensions(importee, importer);
      }
      if (isProxyModule) {
        if (!resolved || resolved.external) {
          return {
            id: wrapId(resolved ? resolved.id : importee, EXTERNAL_SUFFIX),
            external: false
          };
        }
        // This will make sure meta properties in "resolved" are correctly attached to the module
        this.load(resolved);
        return {
          id: wrapId(resolved.id, PROXY_SUFFIX),
          external: false
        };
      }
      if (resolved && isModuleRegistration) {
        return { id: wrapId(resolved.id, DYNAMIC_REGISTER_SUFFIX), external: false };
      }
      return resolved;
    });
  };
}
