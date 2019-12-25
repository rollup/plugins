/* eslint-disable no-undefined */
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

const extractors = {
  Identifier(names, node) {
    names.push(node.name);
  },

  ObjectPattern(names, node) {
    node.properties.forEach((prop) => {
      getExtractor(prop.value.type)(names, prop.value);
    });
  },

  ArrayPattern(names, node) {
    node.elements.forEach((element) => {
      if (!element) return;
      getExtractor(element.type)(names, element);
    });
  },

  RestElement(names, node) {
    getExtractor(node.argument.type)(names, node.argument);
  },

  AssignmentPattern(names, node) {
    getExtractor(node.left.type)(names, node.left);
  }
};

export function flatten(node) {
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

export function extractNames(node) {
  const names = [];
  extractors[node.type](names, node);
  return names;
}

function getExtractor(type) {
  const extractor = extractors[type];
  if (!extractor) throw new SyntaxError(`${type} pattern not supported.`);
  return extractor;
}

export function isTruthy(node) {
  if (node.type === 'Literal') return !!node.value;
  if (node.type === 'ParenthesizedExpression') return isTruthy(node.expression);
  if (node.operator in operators) return operators[node.operator](node);
  return undefined;
}

export function isFalsy(node) {
  return not(isTruthy(node));
}

function not(value) {
  return value === undefined ? value : !value;
}

function equals(a, b, strict) {
  if (a.type !== b.type) return undefined;
  // eslint-disable-next-line eqeqeq
  if (a.type === 'Literal') return strict ? a.value === b.value : a.value == b.value;
  return undefined;
}
