import { dirname, resolve } from 'path';

import { sync as nodeResolveSync } from 'resolve';

import { DYNAMIC_JSON_PREFIX, DYNAMIC_REGISTER_PREFIX } from './helpers';
import { normalizePathSlashes } from './utils';

export { default as isReference } from 'is-reference';

const operators = {
  '==': (x) => equals(x.left, x.right, false),

  '!=': (x) => not(operators['=='](x)),

  '===': (x) => equals(x.left, x.right, true),

  '!==': (x) => not(operators['==='](x)),

  '!': (x) => isFalsy(x.argument),

  '&&': (x) => isTruthy(x.left) && isTruthy(x.right),

  '||': (x) => isTruthy(x.left) || isTruthy(x.right)
};

function not(value) {
  return value === null ? value : !value;
}

function equals(a, b, strict) {
  if (a.type !== b.type) return null;
  // eslint-disable-next-line eqeqeq
  if (a.type === 'Literal') return strict ? a.value === b.value : a.value == b.value;
  return null;
}

export function isTruthy(node) {
  if (!node) return false;
  if (node.type === 'Literal') return !!node.value;
  if (node.type === 'ParenthesizedExpression') return isTruthy(node.expression);
  if (node.operator in operators) return operators[node.operator](node);
  return null;
}

export function isFalsy(node) {
  return not(isTruthy(node));
}

export function getKeypath(node) {
  const parts = [];

  while (node.type === 'MemberExpression') {
    if (node.computed) return null;

    parts.unshift(node.property.name);
    // eslint-disable-next-line no-param-reassign
    node = node.object;
  }

  if (node.type !== 'Identifier') return null;

  const { name } = node;
  parts.unshift(name);

  return { name, keypath: parts.join('.') };
}

export const KEY_COMPILED_ESM = '__esModule';

export function isDefineCompiledEsm(node) {
  const definedProperty =
    getDefinePropertyCallName(node, 'exports') || getDefinePropertyCallName(node, 'module.exports');
  if (definedProperty && definedProperty.key === KEY_COMPILED_ESM) {
    return isTruthy(definedProperty.value);
  }
  return false;
}

export function getAssignedMember(node) {
  const { left, operator, right } = node.expression;
  if (operator !== '=' || left.type !== 'MemberExpression') {
    return null;
  }
  let assignedIdentifier;
  if (left.object.type === 'Identifier') {
    // exports.foo = ...
    assignedIdentifier = left.object;
  } else if (
    left.object.type === 'MemberExpression' &&
    left.object.property.type === 'Identifier'
  ) {
    // module.exports.foo = ...
    assignedIdentifier = left.object.property;
  } else {
    return null;
  }

  if (!['module', 'exports'].includes(assignedIdentifier.name)) {
    return null;
  }

  const object = left.object ? left.object.name : null;
  const key = left.property ? left.property.name : null;
  return { object, key, value: right };
}

export function getDefinePropertyCallName(node, targetName) {
  const targetNames = targetName.split('.');

  const {
    callee: { object, property }
  } = node;
  if (!object || object.type !== 'Identifier' || object.name !== 'Object') return;
  if (!property || property.type !== 'Identifier' || property.name !== 'defineProperty') return;
  if (node.arguments.length !== 3) return;

  const [target, key, value] = node.arguments;
  if (targetNames.length === 1) {
    if (target.type !== 'Identifier' || target.name !== targetNames[0]) {
      return;
    }
  }

  if (targetNames.length === 2) {
    if (
      target.type !== 'MemberExpression' ||
      target.object.name !== targetNames[0] ||
      target.property.name !== targetNames[1]
    ) {
      return;
    }
  }

  if (value.type !== 'ObjectExpression' || !value.properties) return;

  const valueProperty = value.properties.find((p) => p.key && p.key.name === 'value');
  if (!valueProperty || !valueProperty.value) return;

  // eslint-disable-next-line consistent-return
  return { key: key.value, value: valueProperty.value };
}

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
    // `require` is hidden by a variable in local scope
    if (scope.contains('require')) return false;

    return true;
  } else if (node.type === 'MemberExpression' /* `[something].[something]` */) {
    // `module.[something]`
    if (node.object.type !== 'Identifier' || node.object.name !== 'module') return false;

    // `module` is hidden by a variable in local scope
    if (scope.contains('module')) return false;

    // `module.require(...)`
    if (node.property.type !== 'Identifier' || node.property.name !== 'require') return false;

    return true;
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
  const requiredBySource = Object.create(null);
  const dynamicRegisterSources = [];
  let uid = 0;

  function getRequired(node, scope, name) {
    let sourceId = getRequireStringArg(node);
    const isDynamicRegister = sourceId.startsWith(DYNAMIC_REGISTER_PREFIX);
    if (isDynamicRegister) {
      sourceId = sourceId.substr(DYNAMIC_REGISTER_PREFIX.length);
    }

    const existing = requiredBySource[sourceId];
    if (!existing) {
      const isDynamic = hasDynamicModuleForPath(sourceId, id, dynamicRequireModuleSet);

      if (!name) {
        do {
          name = `require$$${uid}`;
          uid += 1;
        } while (scope.contains(name));
      }

      if (isDynamicRegister) {
        if (sourceId.endsWith('.json')) {
          sourceId = DYNAMIC_JSON_PREFIX + sourceId;
        }
        dynamicRegisterSources.push(sourceId);
      }

      if (!isDynamic || sourceId.endsWith('.json')) {
        requiredSources.push(sourceId);
      }

      requiredBySource[sourceId] = { source: sourceId, name, importsDefault: false, isDynamic };
    }

    return requiredBySource[sourceId];
  }

  return { getRequired, requiredBySource, requiredSources, dynamicRegisterSources };
}
