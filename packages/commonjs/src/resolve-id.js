/* eslint-disable no-param-reassign, no-undefined */

import { statSync } from 'fs';
import { dirname, resolve, sep } from 'path';

import {
  DYNAMIC_JSON_PREFIX,
  DYNAMIC_PACKAGES_ID,
  EXTERNAL_SUFFIX,
  HELPERS_ID,
  isWrappedId,
  PROXY_SUFFIX,
  REQUIRE_SUFFIX,
  unwrapId,
  wrapId
} from './helpers';
import {
  isModuleRegisterProxy,
  unwrapModuleRegisterProxy,
  wrapModuleRegisterProxy
} from './dynamic-packages-manager';

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

  return function resolveId(importee, rawImporter) {
    const importer =
      rawImporter && isModuleRegisterProxy(rawImporter)
        ? unwrapModuleRegisterProxy(rawImporter)
        : rawImporter;

    // Proxies are only importing resolved ids, no need to resolve again
    if (importer && isWrappedId(importer, PROXY_SUFFIX)) {
      return importee;
    }

    const isProxyModule = isWrappedId(importee, PROXY_SUFFIX);
    const isRequiredModule = isWrappedId(importee, REQUIRE_SUFFIX);
    let isModuleRegistration = false;

    if (isProxyModule) {
      importee = unwrapId(importee, PROXY_SUFFIX);
    } else if (isRequiredModule) {
      importee = unwrapId(importee, REQUIRE_SUFFIX);

      isModuleRegistration = isModuleRegisterProxy(importee);
      if (isModuleRegistration) {
        importee = unwrapModuleRegisterProxy(importee);
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

    return this.resolve(importee, importer, {
      skipSelf: true,
      custom: { 'node-resolve': { isRequire: isProxyModule || isRequiredModule } }
    }).then((resolved) => {
      if (!resolved) {
        resolved = resolveExtensions(importee, importer);
      }
      if (resolved && isProxyModule) {
        resolved.id = wrapId(resolved.id, resolved.external ? EXTERNAL_SUFFIX : PROXY_SUFFIX);
        resolved.external = false;
      } else if (resolved && isModuleRegistration) {
        resolved.id = wrapModuleRegisterProxy(resolved.id);
      } else if (!resolved && (isProxyModule || isRequiredModule)) {
        return { id: wrapId(importee, EXTERNAL_SUFFIX), external: false };
      }
      return resolved;
    });
  };
}
