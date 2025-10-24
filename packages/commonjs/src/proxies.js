import { HELPERS_ID, IS_WRAPPED_COMMONJS } from './helpers';
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

export async function getStaticRequireProxy(id, requireReturnsDefault, loadModule) {
  const name = getName(id);
  const {
    meta: { commonjs: commonjsMeta }
  } = await loadModule({ id });
  if (!commonjsMeta) {
    return getUnknownRequireProxy(id, requireReturnsDefault);
  }
  if (commonjsMeta.isCommonJS) {
    return `export { __moduleExports as default } from ${JSON.stringify(id)};`;
  }
  if (!requireReturnsDefault) {
    return `import { getAugmentedNamespace } from "${HELPERS_ID}"; import * as ${name} from ${JSON.stringify(
      id
    )}; export default /*@__PURE__*/getAugmentedNamespace(${name});`;
  }
  if (
    requireReturnsDefault !== true &&
    (requireReturnsDefault === 'namespace' ||
      !commonjsMeta.hasDefaultExport ||
      (requireReturnsDefault === 'auto' && commonjsMeta.hasNamedExports))
  ) {
    return `import * as ${name} from ${JSON.stringify(id)}; export default ${name};`;
  }
  return `export { default } from ${JSON.stringify(id)};`;
}

export function getEntryProxy(id, defaultIsModuleExports, getModuleInfo, shebang) {
  const {
    meta: { commonjs: commonjsMeta },
    hasDefaultExport
  } = getModuleInfo(id);
  if (!commonjsMeta || commonjsMeta.isCommonJS !== IS_WRAPPED_COMMONJS) {
    const stringifiedId = JSON.stringify(id);
    let code = `export * from ${stringifiedId};`;
    if (hasDefaultExport) {
      code += `export { default } from ${stringifiedId};`;
    }
    return shebang + code;
  }
  const result = getEsImportProxy(id, defaultIsModuleExports, true);
  return {
    ...result,
    code: shebang + result.code
  };
}

export function getEsImportProxy(id, defaultIsModuleExports, moduleSideEffects) {
  const name = getName(id);
  const exportsName = `${name}Exports`;
  const requireModule = `require${capitalize(name)}`;
  let code =
    `import { getDefaultExportFromCjs } from "${HELPERS_ID}";\n` +
    `import { __require as ${requireModule} } from ${JSON.stringify(id)};\n` +
    `var ${exportsName} = ${moduleSideEffects ? '' : '/*@__PURE__*/ '}${requireModule}();\n` +
    `export { ${exportsName} as __moduleExports };`;
  if (defaultIsModuleExports === true) {
    code += `\nexport { ${exportsName} as default };`;
  } else if (defaultIsModuleExports === false) {
    code += `\nexport default ${exportsName}.default;`;
  } else {
    code += `\nexport default /*@__PURE__*/getDefaultExportFromCjs(${exportsName});`;
  }
  return {
    code,
    syntheticNamedExports: '__moduleExports'
  };
}

// For external Node built-ins required from wrapped CommonJS modules, we must not
// hoist an ESM import of the built-in (which would eagerly load it). Instead,
// expose a lazy `__require()` that resolves the built-in at runtime via
// `createRequire(import.meta.url)`.
/**
 * Generate the proxy module used for external Node built-ins that are
 * `require()`d from wrapped CommonJS modules.
 *
 * Strategy:
 * - 'create-require' (default): import `createRequire` from 'node:module' and
 *   lazily resolve the built-in at runtime. This keeps Node behaviour and
 *   avoids hoisting, but hard-depends on Node's `module` API.
 * - 'stub': emit a tiny proxy that exports a throwing `__require()` without
 *   importing from 'node:module'. This makes output parse/run in edge
 *   runtimes when the path is dead, and fails loudly if executed.
 */
export function getExternalBuiltinRequireProxy(id, strategy = 'create-require') {
  if (strategy === 'stub') {
    const msg = `Node built-in ${id} is not available in this environment`;
    return `export function __require() { throw new Error(${JSON.stringify(msg)}); }`;
  }
  const stringifiedId = JSON.stringify(id);
  return (
    `import { createRequire } from 'node:module';\n` +
    `const require = createRequire(import.meta.url);\n` +
    `export function __require() { return require(${stringifiedId}); }`
  );
}
