import { dirname, resolve } from 'path';

import { sync as nodeResolveSync } from 'resolve';

import { DYNAMIC_JSON_PREFIX, DYNAMIC_REGISTER_PREFIX } from './helpers';
import { normalizePathSlashes } from './utils';

export function isRequireStatement(node, scope) {
  if (!node) return false;
  if (node.type !== 'CallExpression') return false;

  // Weird case of `require()` or `module.require()` without arguments
  if (node.arguments.length === 0) return false;

  return isRequireIdentifier(node.callee, scope);
}

export function isRequireIdentifier(node, scope) {
  if (!node) return false;

  if (node.type === 'Identifier' && node.name === 'require' /* `require` */) {
    // `require` may be hidden by a variable in local scope
    return !scope.contains('require');
  } else if (node.type === 'MemberExpression' /* `[something].[something]` */) {
    // `module.[something]`
    if (node.object.type !== 'Identifier' || node.object.name !== 'module') return false;

    // `module` is hidden by a variable in local scope
    if (scope.contains('module')) return false;

    // `module.require(...)`
    return node.property.type === 'Identifier' && node.property.name === 'require';
  }

  return false;
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

function getRequireStringArg(node) {
  return node.arguments[0].type === 'Literal'
    ? node.arguments[0].value
    : node.arguments[0].quasis[0].value.cooked;
}

function hasDynamicModuleForPath(source, id, dynamicRequireModuleSet) {
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

export function shouldUseSimulatedRequire(required, id, dynamicRequireModuleSet) {
  return (
    hasDynamicModuleForPath(required.source, id, dynamicRequireModuleSet) &&
    // We only do `commonjsRequire` for json if it's the `commonjsRegister` call.
    (required.source.startsWith(DYNAMIC_REGISTER_PREFIX) || !required.source.endsWith('.json'))
  );
}

export function getRequireHandlers(id, dynamicRequireModuleSet) {
  const requiredSources = [];
  const dynamicRegisterSources = [];
  const requiredBySource = Object.create(null);
  const requiredByNode = new Map();
  const requireExpressionsWithUsedReturnValue = [];

  function getRequired(node) {
    let sourceId = getRequireStringArg(node);
    const isDynamicRegister = sourceId.startsWith(DYNAMIC_REGISTER_PREFIX);
    if (isDynamicRegister) {
      sourceId = sourceId.substr(DYNAMIC_REGISTER_PREFIX.length);
    }

    const existing = requiredBySource[sourceId];
    if (!existing) {
      const isDynamic = hasDynamicModuleForPath(sourceId, id, dynamicRequireModuleSet);
      if (isDynamicRegister) {
        if (sourceId.endsWith('.json')) {
          sourceId = DYNAMIC_JSON_PREFIX + sourceId;
        }
        dynamicRegisterSources.push(sourceId);
      }

      if (!isDynamic || sourceId.endsWith('.json')) {
        requiredSources.push(sourceId);
      }

      requiredBySource[sourceId] = {
        source: sourceId,
        name: null,
        isDynamic,
        nodesUsingRequired: []
      };
    }

    return requiredBySource[sourceId];
  }

  function addRequireStatement(node, scope, usesReturnValue) {
    const required = getRequired(node);
    requiredByNode.set(node, { scope, required });
    if (usesReturnValue) {
      required.nodesUsingRequired.push(node);
      requireExpressionsWithUsedReturnValue.push(node);
    }
  }

  return {
    addRequireStatement,
    dynamicRegisterSources,
    requiredByNode,
    requiredBySource,
    requiredSources,
    requireExpressionsWithUsedReturnValue
  };
}
