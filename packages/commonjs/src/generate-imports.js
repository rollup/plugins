import { dirname, resolve } from 'path';

import { sync as nodeResolveSync } from 'resolve';

import {
  DYNAMIC_MODULES_ID,
  EXPORTS_SUFFIX,
  HELPERS_ID,
  IS_WRAPPED_COMMONJS,
  MODULE_SUFFIX,
  wrapId
} from './helpers';
import { normalizePathSlashes } from './utils';

export function isRequireStatement(node, scope) {
  if (!node) return false;
  if (node.type !== 'CallExpression') return false;

  // Weird case of `require()` or `module.require()` without arguments
  if (node.arguments.length === 0) return false;

  return isRequire(node.callee, scope);
}

function isRequire(node, scope) {
  return (
    (node.type === 'Identifier' && node.name === 'require' && !scope.contains('require')) ||
    (node.type === 'MemberExpression' && isModuleRequire(node, scope))
  );
}

export function isModuleRequire({ object, property }, scope) {
  return (
    object.type === 'Identifier' &&
    object.name === 'module' &&
    property.type === 'Identifier' &&
    property.name === 'require' &&
    !scope.contains('module')
  );
}

export function isStaticRequireStatement(node, scope) {
  if (!isRequireStatement(node, scope)) return false;
  return !hasDynamicArguments(node);
}

function hasDynamicArguments(node) {
  return (
    node.arguments.length > 1 ||
    (node.arguments[0].type !== 'Literal' &&
      (node.arguments[0].type !== 'TemplateLiteral' || node.arguments[0].expressions.length > 0))
  );
}

const reservedMethod = { resolve: true, cache: true, main: true };

export function isNodeRequirePropertyAccess(parent) {
  return parent && parent.property && reservedMethod[parent.property.name];
}

export function isIgnoredRequireStatement(requiredNode, ignoreRequire) {
  return ignoreRequire(requiredNode.arguments[0].value);
}

export function getRequireStringArg(node) {
  return node.arguments[0].type === 'Literal'
    ? node.arguments[0].value
    : node.arguments[0].quasis[0].value.cooked;
}

export function hasDynamicModuleForPath(source, id, dynamicRequireModuleSet) {
  if (!/^(?:\.{0,2}[/\\]|[A-Za-z]:[/\\])/.test(source)) {
    try {
      const resolvedPath = normalizePathSlashes(nodeResolveSync(source, { basedir: dirname(id) }));
      if (dynamicRequireModuleSet.has(resolvedPath)) {
        return true;
      }
    } catch (ex) {
      // Probably a node.js internal module
      return false;
    }

    return false;
  }

  for (const attemptExt of ['', '.js', '.json']) {
    const resolvedPath = normalizePathSlashes(resolve(dirname(id), source + attemptExt));
    if (dynamicRequireModuleSet.has(resolvedPath)) {
      return true;
    }
  }

  return false;
}

export function getRequireHandlers() {
  const requireExpressions = [];

  function addRequireStatement(sourceId, node, scope, usesReturnValue, toBeRemoved) {
    requireExpressions.push({ sourceId, node, scope, usesReturnValue, toBeRemoved });
  }

  async function rewriteRequireExpressionsAndGetImportBlock(
    magicString,
    topLevelDeclarations,
    topLevelRequireDeclarators,
    reassignedNames,
    helpersName,
    dynamicRequireName,
    moduleName,
    exportsName,
    id,
    exportMode,
    resolveRequireSourcesAndGetMeta,
    needsRequireWrapper,
    isEsModule,
    usesRequire
  ) {
    const imports = [];
    imports.push(`import * as ${helpersName} from "${HELPERS_ID}";`);
    if (usesRequire) {
      imports.push(
        `import { commonjsRequire as ${dynamicRequireName} } from "${DYNAMIC_MODULES_ID}";`
      );
    }
    if (exportMode === 'module') {
      imports.push(
        `import { __module as ${moduleName}, exports as ${exportsName} } from ${JSON.stringify(
          wrapId(id, MODULE_SUFFIX)
        )}`
      );
    } else if (exportMode === 'exports') {
      imports.push(
        `import { __exports as ${exportsName} } from ${JSON.stringify(wrapId(id, EXPORTS_SUFFIX))}`
      );
    }
    const requiresBySource = collectSources(requireExpressions);
    const { requireTargets, usesRequireWrapper } = await resolveRequireSourcesAndGetMeta(
      id,
      needsRequireWrapper ? IS_WRAPPED_COMMONJS : !isEsModule,
      Object.keys(requiresBySource)
    );
    processRequireExpressions(imports, requireTargets, requiresBySource, magicString);
    return {
      importBlock: imports.length ? `${imports.join('\n')}\n\n` : '',
      usesRequireWrapper
    };
  }

  return {
    addRequireStatement,
    rewriteRequireExpressionsAndGetImportBlock
  };
}

function collectSources(requireExpressions) {
  const requiresBySource = Object.create(null);
  for (const { sourceId, node, scope, usesReturnValue, toBeRemoved } of requireExpressions) {
    if (!requiresBySource[sourceId]) {
      requiresBySource[sourceId] = [];
    }
    const requires = requiresBySource[sourceId];
    requires.push({ node, scope, usesReturnValue, toBeRemoved });
  }
  return requiresBySource;
}

function processRequireExpressions(imports, requireTargets, requiresBySource, magicString) {
  const generateRequireName = getGenerateRequireName();
  for (const { source, id: resolveId, isCommonJS } of requireTargets) {
    const requires = requiresBySource[source];
    const name = generateRequireName(requires);
    if (isCommonJS === IS_WRAPPED_COMMONJS) {
      for (const { node } of requires) {
        magicString.overwrite(node.start, node.end, `${name}()`);
      }
      imports.push(`import { __require as ${name} } from ${JSON.stringify(resolveId)};`);
    } else {
      let usesRequired = false;
      for (const { node, usesReturnValue, toBeRemoved } of requires) {
        if (usesReturnValue) {
          usesRequired = true;
          magicString.overwrite(node.start, node.end, name);
        } else {
          magicString.remove(toBeRemoved.start, toBeRemoved.end);
        }
      }
      imports.push(`import ${usesRequired ? `${name} from ` : ''}${JSON.stringify(resolveId)};`);
    }
  }
}

function getGenerateRequireName() {
  let uid = 0;
  return (requires) => {
    let name;
    const hasNameConflict = ({ scope }) => scope.contains(name);
    do {
      name = `require$$${uid}`;
      uid += 1;
    } while (requires.some(hasNameConflict));
    return name;
  };
}
