/* eslint-disable no-param-reassign, no-undefined */

import { statSync } from 'fs';
import { dirname, resolve, sep } from 'path';

import {
  DYNAMIC_MODULES_ID,
  ES_IMPORT_SUFFIX,
  EXPORTS_SUFFIX,
  EXTERNAL_SUFFIX,
  HELPERS_ID,
  isWrappedId,
  MODULE_SUFFIX,
  PROXY_SUFFIX,
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
    if (
      isWrappedId(importee, MODULE_SUFFIX) ||
      isWrappedId(importee, EXPORTS_SUFFIX) ||
      isWrappedId(importee, PROXY_SUFFIX) ||
      isWrappedId(importee, ES_IMPORT_SUFFIX) ||
      isWrappedId(importee, EXTERNAL_SUFFIX)
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

    if (importee.startsWith(HELPERS_ID) || importee === DYNAMIC_MODULES_ID) {
      return importee;
    }

    if (importee.startsWith('\0')) {
      return null;
    }

    const resolved =
      (await this.resolve(importee, importer, Object.assign({ skipSelf: true }, resolveOptions))) ||
      resolveExtensions(importee, importer, extensions);
    let isCommonJsImporter = false;
    if (importer) {
      const moduleInfo = this.getModuleInfo(importer);
      if (moduleInfo) {
        const importerCommonJsMeta = moduleInfo.meta.commonjs;
        if (
          importerCommonJsMeta &&
          (importerCommonJsMeta.isCommonJS || importerCommonJsMeta.isMixedModule)
        ) {
          isCommonJsImporter = true;
        }
      }
    }
    if (resolved && !isCommonJsImporter) {
      const {
        meta: { commonjs: commonjsMeta }
      } = await this.load(resolved);
      if (commonjsMeta && commonjsMeta.isCommonJS === 'withRequireFunction') {
        return wrapId(resolved.id, ES_IMPORT_SUFFIX);
      }
    }
    return resolved;
  };
}
