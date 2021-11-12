/* eslint-disable no-param-reassign, no-undefined */

import { statSync } from 'fs';
import { dirname, resolve, sep } from 'path';

import {
  DYNAMIC_MODULES_ID,
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
    if (isWrappedId(importee, WRAPPED_SUFFIX)) {
      return unwrapId(importee, WRAPPED_SUFFIX);
    }

    if (
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

    // Except for exports, proxies are only importing resolved ids,
    // no need to resolve again
    if (
      importer &&
      (importer === DYNAMIC_MODULES_ID ||
        isWrappedId(importer, PROXY_SUFFIX) ||
        isWrappedId(importer, ES_IMPORT_SUFFIX))
    ) {
      return importee;
    }

    if (importee.startsWith('\0')) {
      return null;
    }

    // If this is an entry point or ESM import, we need to figure out if it is wrapped and if that
    // is the case, we need to add a proxy.
    const customOptions = resolveOptions.custom;

    // We are adding this option when resolving from CommonJS -> no ESM proxy needed
    if (customOptions && customOptions['node-resolve'] && customOptions['node-resolve'].isRequire) {
      return null;
    }

    const resolved =
      (await this.resolve(importee, importer, Object.assign({ skipSelf: true }, resolveOptions))) ||
      resolveExtensions(importee, importer, extensions);
    if (!resolved || resolved.external) {
      return resolved;
    }
    const {
      meta: { commonjs: commonjsMeta }
    } = await this.load(resolved);
    if (commonjsMeta && commonjsMeta.isCommonJS === IS_WRAPPED_COMMONJS) {
      return wrapId(resolved.id, ES_IMPORT_SUFFIX);
    }
    return resolved;
  };
}
