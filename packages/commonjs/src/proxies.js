import { HELPERS_ID } from './helpers';
import { capitalize, getName } from './utils';

export function getUnknownRequireProxy(id, requireReturnsDefault) {
  if (requireReturnsDefault === true || id.endsWith('.json')) {
    return `export { default } from ${JSON.stringify(id)};`;
  }
  const name = getName(id);
  const exported =
    requireReturnsDefault === 'auto'
      ? `import { getDefaultExportFromNamespaceIfNotNamed } from "${HELPERS_ID}"; export default /*@__PURE__*/getDefaultExportFromNamespaceIfNotNamed(${name});`
      : requireReturnsDefault === 'preferred'
      ? `import { getDefaultExportFromNamespaceIfPresent } from "${HELPERS_ID}"; export default /*@__PURE__*/getDefaultExportFromNamespaceIfPresent(${name});`
      : !requireReturnsDefault
      ? `import { getAugmentedNamespace } from "${HELPERS_ID}"; export default /*@__PURE__*/getAugmentedNamespace(${name});`
      : `export default ${name};`;
  return `import * as ${name} from ${JSON.stringify(id)}; ${exported}`;
}

export async function getStaticRequireProxy(
  id,
  requireReturnsDefault,
  esModulesWithDefaultExport,
  esModulesWithNamedExports,
  loadModule
) {
  const name = getName(id);
  const {
    meta: { commonjs: commonjsMeta }
  } = await loadModule({ id });
  if (commonjsMeta && commonjsMeta.isCommonJS) {
    return `export { __moduleExports as default } from ${JSON.stringify(id)};`;
  } else if (!commonjsMeta) {
    return getUnknownRequireProxy(id, requireReturnsDefault);
  } else if (!requireReturnsDefault) {
    return `import { getAugmentedNamespace } from "${HELPERS_ID}"; import * as ${name} from ${JSON.stringify(
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
  return `export { default } from ${JSON.stringify(id)};`;
}

export function getEsImportProxy(id, defaultIsModuleExports) {
  const name = getName(id);
  const exportsName = `${name}Exports`;
  const requireModule = `require${capitalize(name)}`;
  let code =
    `import { getDefaultExportFromCjs } from "${HELPERS_ID}";\n` +
    `import { __require as ${requireModule} } from ${JSON.stringify(id)};\n` +
    `var ${exportsName} = ${requireModule}();\n` +
    `export { ${exportsName} as __moduleExports };`;
  if (defaultIsModuleExports) {
    code += `\nexport { ${exportsName} as default };`;
  } else {
    code += `export default /*@__PURE__*/getDefaultExportFromCjs(${exportsName});`;
  }
  return {
    code,
    syntheticNamedExports: '__moduleExports',
    meta: { commonjs: { isCommonJS: false } }
  };
}
