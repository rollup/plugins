import { dirname, resolve } from 'path';

import { sync as nodeResolveSync } from 'resolve';

import { isLocallyShadowed } from './ast-utils';
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
  const requiredSources = [];
  const requiredBySource = Object.create(null);
  const requiredByNode = new Map();
  const requireExpressionsWithUsedReturnValue = [];

  function addRequireStatement(sourceId, node, scope, usesReturnValue) {
    const required = getRequired(sourceId);
    requiredByNode.set(node, { scope, required });
    if (usesReturnValue) {
      required.nodesUsingRequired.push(node);
      requireExpressionsWithUsedReturnValue.push(node);
    }
  }

  function getRequired(sourceId) {
    if (!requiredBySource[sourceId]) {
      requiredSources.push(sourceId);

      requiredBySource[sourceId] = {
        source: sourceId,
        name: null,
        nodesUsingRequired: []
      };
    }

    return requiredBySource[sourceId];
  }

  // TODO Lukas extract helpers
  function rewriteRequireExpressions(
    magicString,
    topLevelDeclarations,
    topLevelRequireDeclarators,
    reassignedNames
  ) {
    // Determine the used names and removed declarators
    const removedDeclarators = new Set();
    for (const declarator of topLevelRequireDeclarators) {
      const { required } = requiredByNode.get(declarator.init);
      if (!required.name) {
        const potentialName = declarator.id.name;
        if (
          !reassignedNames.has(potentialName) &&
          !required.nodesUsingRequired.some((node) =>
            isLocallyShadowed(potentialName, requiredByNode.get(node).scope)
          )
        ) {
          required.name = potentialName;
          removedDeclarators.add(declarator);
        }
      }
    }

    // Determine names where they are still missing and rewrite expressions
    let uid = 0;
    for (const requireExpression of requireExpressionsWithUsedReturnValue) {
      const { required } = requiredByNode.get(requireExpression);
      if (!required.name) {
        let potentialName;
        const isUsedName = (node) => requiredByNode.get(node).scope.contains(potentialName);
        do {
          potentialName = `require$$${uid}`;
          uid += 1;
        } while (required.nodesUsingRequired.some(isUsedName));
        required.name = potentialName;
      }
      magicString.overwrite(requireExpression.start, requireExpression.end, required.name);
    }

    // Rewrite declarations, checking which declarators can be removed by their init
    for (const declaration of topLevelDeclarations) {
      let keepDeclaration = false;
      let [{ start }] = declaration.declarations;
      for (const declarator of declaration.declarations) {
        if (removedDeclarators.has(declarator)) {
          magicString.remove(start, declarator.end);
        } else if (!keepDeclaration) {
          magicString.remove(start, declarator.start);
          keepDeclaration = true;
        }
        start = declarator.end;
      }
      if (!keepDeclaration) {
        magicString.remove(declaration.start, declaration.end);
      }
    }
  }

  return {
    addRequireStatement,
    requiredBySource,
    requiredSources,
    rewriteRequireExpressions
  };
}
