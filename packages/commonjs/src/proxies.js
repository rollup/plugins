import { readFileSync } from 'fs';

import { DYNAMIC_JSON_PREFIX, getVirtualPathForDynamicRequirePath, HELPERS_ID } from './helpers';
import { getIsCjsPromise } from './is-cjs';
import { normalizePathSlashes } from './transform';
import { getName } from './utils';

// e.g. id === "commonjsHelpers?commonjsRegister"
export function getSpecificHelperProxy(id) {
  return `export {${id.split('?')[1]} as default} from '${HELPERS_ID}';`;
}

export function getUnknownRequireProxy(id, requireReturnsDefault) {
  if (requireReturnsDefault === true || id.endsWith('.json')) {
    return `export {default} from ${JSON.stringify(id)};`;
  }
  const name = getName(id);
  const exported =
    requireReturnsDefault === 'auto'
      ? `import {getDefaultExportFromNamespaceIfNotNamed} from "${HELPERS_ID}"; export default /*@__PURE__*/getDefaultExportFromNamespaceIfNotNamed(${name});`
      : requireReturnsDefault === 'preferred'
      ? `import {getDefaultExportFromNamespaceIfPresent} from "${HELPERS_ID}"; export default /*@__PURE__*/getDefaultExportFromNamespaceIfPresent(${name});`
      : !requireReturnsDefault
      ? `import {getAugmentedNamespace} from "${HELPERS_ID}"; export default /*@__PURE__*/getAugmentedNamespace(${name});`
      : `export default ${name};`;
  return `import * as ${name} from ${JSON.stringify(id)}; ${exported}`;
}

export function getDynamicJsonProxy(id, commonDir) {
  const normalizedPath = normalizePathSlashes(id.slice(DYNAMIC_JSON_PREFIX.length));
  return `const commonjsRegister = require('${HELPERS_ID}?commonjsRegister');\ncommonjsRegister(${JSON.stringify(
    getVirtualPathForDynamicRequirePath(normalizedPath, commonDir)
  )}, function (module, exports) {
  module.exports = require(${JSON.stringify(normalizedPath)});
});`;
}

export function getDynamicRequireProxy(normalizedPath, commonDir) {
  return `const commonjsRegister = require('${HELPERS_ID}?commonjsRegister');\ncommonjsRegister(${JSON.stringify(
    getVirtualPathForDynamicRequirePath(normalizedPath, commonDir)
  )}, function (module, exports) {
  ${readFileSync(normalizedPath, { encoding: 'utf8' })}
});`;
}

export async function getStaticRequireProxy(
  id,
  requireReturnsDefault,
  esModulesWithDefaultExport,
  esModulesWithNamedExports
) {
  const name = getName(id);
  const isCjs = await getIsCjsPromise(id);
  if (isCjs) {
    return `import { __moduleExports } from ${JSON.stringify(id)}; export default __moduleExports;`;
  } else if (isCjs === null) {
    return getUnknownRequireProxy(id, requireReturnsDefault);
  } else if (!requireReturnsDefault) {
    return `import {getAugmentedNamespace} from "${HELPERS_ID}"; import * as ${name} from ${JSON.stringify(
      id
    )}; export default /*@__PURE__*/getAugmentedNamespace(${name});`;
  } else if (
    requireReturnsDefault !== true &&
    (requireReturnsDefault === 'namespace' ||
      !esModulesWithDefaultExport.has(id) ||
      (requireReturnsDefault === 'auto' && esModulesWithNamedExports.has(id)))
  ) {
    return `import * as ${name} from ${JSON.stringify(id)}; export default ${name};`;
  }
  return `export {default} from ${JSON.stringify(id)};`;
}
