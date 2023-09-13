import type {
  ArrayPattern,
  AssignmentPattern,
  Identifier,
  ObjectPattern,
  RestElement
} from 'estree';

import type { ExtractAssignedNames } from '../types';

interface Extractors {
  [key: string]: (names: string[], param: any) => void;
}

const extractors: Extractors = {
  ArrayPattern(names: string[], param: ArrayPattern) {
    for (const element of param.elements) {
      if (element) extractors[element.type](names, element);
    }
  },

  AssignmentPattern(names: string[], param: AssignmentPattern) {
    extractors[param.left.type](names, param.left);
  },

  Identifier(names: string[], param: Identifier) {
    names.push(param.name);
  },

  MemberExpression() {},

  ObjectPattern(names: string[], param: ObjectPattern) {
    for (const prop of param.properties) {
      // @ts-ignore Typescript reports that this is not a valid type
      if (prop.type === 'RestElement') {
        extractors.RestElement(names, prop);
      } else {
        extractors[prop.value.type](names, prop.value);
      }
    }
  },

  RestElement(names: string[], param: RestElement) {
    extractors[param.argument.type](names, param.argument);
  }
};

const extractAssignedNames: ExtractAssignedNames = function extractAssignedNames(param) {
  const names: string[] = [];

  extractors[param.type](names, param);
  return names;
};

export { extractAssignedNames as default };
