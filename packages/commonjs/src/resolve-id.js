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

  function resolveId(importee, importer) {
    const isProxyModule = isWrappedId(importee, PROXY_SUFFIX);
    if (isProxyModule) {
      importee = unwrapId(importee, PROXY_SUFFIX);
    }
    if (importee.startsWith('\0')) {
      if (
        importee.startsWith(HELPERS_ID) ||
        importee === DYNAMIC_PACKAGES_ID ||
        importee.startsWith(DYNAMIC_JSON_PREFIX)
      ) {
        return importee;
      }
      if (!isProxyModule) {
        return null;
      }
    }

    if (importer && isWrappedId(importer, PROXY_SUFFIX)) {
      importer = unwrapId(importer, PROXY_SUFFIX);
    }

    return this.resolve(importee, importer, { skipSelf: true }).then((resolved) => {
      if (!resolved) {
        resolved = resolveExtensions(importee, importer);
      }
      if (isProxyModule) {
        if (!resolved) {
          return { id: wrapId(importee, EXTERNAL_SUFFIX), external: false };
        }
        resolved.id = wrapId(resolved.id, resolved.external ? EXTERNAL_SUFFIX : PROXY_SUFFIX);
        resolved.external = false;
        return resolved;
      }
      return resolved;
    });
  }

  return resolveId;
}
