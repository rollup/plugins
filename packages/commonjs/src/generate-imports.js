import { dirname, resolve } from 'path';

import { sync as nodeResolveSync } from 'resolve';

import {
  DYNAMIC_MODULES_ID,
  EXPORTS_SUFFIX,
  EXTERNAL_SUFFIX,
  HELPERS_ID,
  IS_WRAPPED_COMMONJS,
  isWrappedId,
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

export function hasDynamicModuleForPath(source, id, dynamicRequireModules) {
  if (!/^(?:\.{0,2}[/\\]|[A-Za-z]:[/\\])/.test(source)) {
    try {
      const resolvedPath = normalizePathSlashes(nodeResolveSync(source, { basedir: dirname(id) }));
      if (dynamicRequireModules.has(resolvedPath)) {
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
    if (dynamicRequireModules.has(resolvedPath)) {
      return true;
    }
  }

  return false;
}

export function getRequireHandlers() {
  const requireExpressions = [];

  function addRequireStatement(
    sourceId,
    node,
    scope,
    usesReturnValue,
    isInsideTryBlock,
    isInsideConditional,
    toBeRemoved
  ) {
    requireExpressions.push({
      sourceId,
      node,
      scope,
      usesReturnValue,
      isInsideTryBlock,
      isInsideConditional,
      toBeRemoved
    });
  }

  async function rewriteRequireExpressionsAndGetImportBlock(
    magicString,
    topLevelDeclarations,
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
    usesRequire,
    getIgnoreTryCatchRequireStatementMode
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
      Object.keys(requiresBySource).map((source) => {
        return {
          source,
          isConditional: requiresBySource[source].every((require) => require.isInsideConditional)
        };
      })
    );
    processRequireExpressions(
      imports,
      requireTargets,
      requiresBySource,
      getIgnoreTryCatchRequireStatementMode,
      magicString
    );
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
  for (const requireExpression of requireExpressions) {
    const { sourceId } = requireExpression;
    if (!requiresBySource[sourceId]) {
      requiresBySource[sourceId] = [];
    }
    const requires = requiresBySource[sourceId];
    requires.push(requireExpression);
  }
  return requiresBySource;
}

function processRequireExpressions(
  imports,
  requireTargets,
  requiresBySource,
  getIgnoreTryCatchRequireStatementMode,
  magicString
) {
  const generateRequireName = getGenerateRequireName();
  for (const { source, id: resolvedId, isCommonJS } of requireTargets) {
    const requires = requiresBySource[source];
    const name = generateRequireName(requires);
    let usesRequired = false;
    let needsImport = false;
    for (const { node, usesReturnValue, toBeRemoved, isInsideTryBlock } of requires) {
      const { canConvertRequire, shouldRemoveRequire } =
        isInsideTryBlock && isWrappedId(resolvedId, EXTERNAL_SUFFIX)
          ? getIgnoreTryCatchRequireStatementMode(source)
          : { canConvertRequire: true, shouldRemoveRequire: false };
      if (shouldRemoveRequire) {
        if (usesReturnValue) {
          magicString.overwrite(node.start, node.end, 'undefined');
        } else {
          magicString.remove(toBeRemoved.start, toBeRemoved.end);
        }
      } else if (canConvertRequire) {
        needsImport = true;
        if (isCommonJS === IS_WRAPPED_COMMONJS) {
          magicString.overwrite(node.start, node.end, `${name}()`);
        } else if (usesReturnValue) {
          usesRequired = true;
          magicString.overwrite(node.start, node.end, name);
        } else {
          magicString.remove(toBeRemoved.start, toBeRemoved.end);
        }
      }
    }
    if (needsImport) {
      if (isCommonJS === IS_WRAPPED_COMMONJS) {
        imports.push(`import { __require as ${name} } from ${JSON.stringify(resolvedId)};`);
      } else {
        imports.push(`import ${usesRequired ? `${name} from ` : ''}${JSON.stringify(resolvedId)};`);
      }
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
