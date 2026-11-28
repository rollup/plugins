export { default as isReference } from 'is-reference';

function triStateAnd(a, b) {
  if (a === false) return false;
  if (b === false) return false;
  if (a === true && b === true) return true;
  return null;
}

function triStateOr(a, b) {
  if (a === true) return true;
  if (b === true) return true;
  if (a === false && b === false) return false;
  return null;
}

const operators = {
  '==': (x) => equals(x.left, x.right, false),

  '!=': (x) => not(operators['=='](x)),

  '===': (x) => equals(x.left, x.right, true),

  '!==': (x) => not(operators['==='](x)),

  '!': (x) => isFalsy(x.argument),

  '&&': (x) => triStateAnd(isTruthy(x.left), isTruthy(x.right)),

  '||': (x) => triStateOr(isTruthy(x.left), isTruthy(x.right))
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

export function getDefinedExport(node) {
  if (node.arguments.length !== 3 || getKeypath(node.callee)?.keypath !== 'Object.defineProperty') {
    return null;
  }
  const [target, propertyName, descriptor] = node.arguments;
  const targetPath = getKeypath(target);
  if (
    (targetPath?.keypath !== 'exports' && targetPath?.keypath !== 'module.exports') ||
    descriptor.type !== 'ObjectExpression' ||
    typeof propertyName.value !== 'string'
  ) {
    return null;
  }
  const value = descriptor.properties.find((property) => property.key?.name === 'value');
  const isAccessor = descriptor.properties.some(({ key, computed }) =>
    ['get', 'set'].includes(computed ? key?.value : key?.name ?? key?.value)
  );
  return { name: propertyName.value, target: targetPath.name, value: value?.value, isAccessor };
}

export function isShorthandProperty(parent) {
  return parent && parent.type === 'Property' && parent.shorthand;
}

export function isPropertyDefinitionKey(parent, node) {
  return parent && parent.type === 'PropertyDefinition' && parent.key === node;
}

export function hasDefineEsmProperty(node) {
  return node.properties.some((property) => {
    if (
      property.type === 'Property' &&
      property.key.type === 'Identifier' &&
      property.key.name === '__esModule' &&
      isTruthy(property.value)
    ) {
      return true;
    }
    return false;
  });
}
