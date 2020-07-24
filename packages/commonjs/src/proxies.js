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
  // TODO Lukas test!
  if (requireReturnsDefault === true || id.endsWith('.json')) {
    return `export {default} from ${JSON.stringify(id)};`;
  }
  const name = getName(id);
  const exported =
    requireReturnsDefault === 'auto'
      ? `import {getDefaultExportFromNamespaceIfNotNamed} from "${HELPERS_ID}"; export default /*@__PURE__*/getDefaultExportFromNamespaceIfNotNamed(${name})`
      : requireReturnsDefault === 'preferred'
      ? `import {getDefaultExportFromNamespaceIfPresent} from "${HELPERS_ID}"; export default /*@__PURE__*/getDefaultExportFromNamespaceIfPresent(${name})`
      : `export default ${name}`;
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
  esModulesWithNamedExports,
  dynamicRequireModuleSet,
  commonDir
) {
  const name = getName(id);
  const isCjs = await getIsCjsPromise(id);
  // TODO Lukas make sure all sub-cases are covered
  if (dynamicRequireModuleSet.has(normalizePathSlashes(id)) && !id.endsWith('.json')) {
    return `import {commonjsRequire} from '${HELPERS_ID}'; const ${name} = commonjsRequire(${JSON.stringify(
      getVirtualPathForDynamicRequirePath(normalizePathSlashes(id), commonDir)
    )}); export default (${name} && ${name}['default']) || ${name}`;
  } else if (isCjs) {
    return `import { __moduleExports } from ${JSON.stringify(id)}; export default __moduleExports;`;
  } else if (isCjs === null) {
    return getUnknownRequireProxy(id, requireReturnsDefault);
  } else if (
    requireReturnsDefault !== true &&
    (!requireReturnsDefault ||
      !esModulesWithDefaultExport.has(id) ||
      (esModulesWithNamedExports.has(id) && requireReturnsDefault === 'auto'))
  ) {
    return `import * as ${name} from ${JSON.stringify(id)}; export default ${name};`;
  }
  return `export {default} from ${JSON.stringify(id)};`;
}
