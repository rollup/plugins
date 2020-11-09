/* eslint-disable no-param-reassign, no-shadow, no-underscore-dangle, no-continue */

import { dirname } from 'path';

import { attachScopes, extractAssignedNames, makeLegalIdentifier } from '@rollup/pluginutils';
import { walk } from 'estree-walker';
import MagicString from 'magic-string';

import {
  getDefinePropertyCallName,
  getKeypath,
  getRequireHandlers,
  isDefineCompiledEsm,
  isFalsy,
  isIgnoredRequireStatement,
  isNodeRequirePropertyAccess,
  isReference,
  isRequireStatement,
  isStaticRequireStatement,
  isTruthy,
  KEY_COMPILED_ESM,
  shouldUseSimulatedRequire
} from './ast-utils';
import {
  getVirtualPathForDynamicRequirePath,
  HELPERS_ID,
  PROXY_SUFFIX,
  REQUIRE_SUFFIX,
  wrapId
} from './helpers';
import { tryParse } from './parse';
import { deconflict, getName, normalizePathSlashes } from './utils';

const exportsPattern = /^(?:module\.)?exports(?:\.([a-zA-Z_$][a-zA-Z_$0-9]*))?$/;

const functionType = /^(?:FunctionDeclaration|FunctionExpression|ArrowFunctionExpression)$/;

export default function transformCommonjs(
  parse,
  code,
  id,
  isEsModule,
  ignoreGlobal,
  ignoreRequire,
  sourceMap,
  isDynamicRequireModulesEnabled,
  dynamicRequireModuleSet,
  disableWrap,
  commonDir,
  astCache
) {
  const ast = astCache || tryParse(parse, code, id);
  const magicString = new MagicString(code);
  const moduleScope = attachScopes(ast, 'scope');
  const uses = { module: false, exports: false, global: false, require: false };
  let scope = moduleScope;
  let lexicalDepth = 0;
  let programDepth = 0;
  let shouldWrap = false;
  let usesCommonjsHelpers = false;
  let defineCompiledEsmExpression = null;

  const globals = new Set();

  // TODO technically wrong since globals isn't populated yet, but ¯\_(ツ)_/¯
  const HELPERS_NAME = deconflict(scope, globals, 'commonjsHelpers');
  const namedExports = {};

  const {
    getRequired,
    requiredBySource,
    requiredSources,
    dynamicRegisterSources
  } = getRequireHandlers(id, dynamicRequireModuleSet);

  // See which names are assigned to. This is necessary to prevent
  // illegally replacing `var foo = require('foo')` with `import foo from 'foo'`,
  // where `foo` is later reassigned. (This happens in the wild. CommonJS, sigh)
  const reassignedNames = new Set();

  const topLevelDeclarations = [];
  const topLevelRequireDeclarators = new Set();
  const requireExpressionsAndScope = [];
  const requireExpressionsWithUsedReturnValue = new Set();

  const skippedNodes = new Set();

  walk(ast, {
    enter(node, parent) {
      if (skippedNodes.has(node)) {
        this.skip();
        return;
      }

      programDepth += 1;
      if (node.scope) ({ scope } = node);
      if (functionType.test(node.type)) lexicalDepth += 1;
      if (sourceMap) {
        magicString.addSourcemapLocation(node.start);
        magicString.addSourcemapLocation(node.end);
      }

      switch (node.type) {
        case 'AssignmentExpression':
          if (node.left.type === 'MemberExpression') {
            const flattened = getKeypath(node.left);
            if (!flattened) return;

            if (scope.contains(flattened.name)) return;

            const exportsPatternMatch = exportsPattern.exec(flattened.keypath);
            if (!exportsPatternMatch || flattened.keypath === 'exports') return;

            // TODO Lukas do not declare we are using module or exports unless we do
            // not remove this
            uses[flattened.name] = true;

            // we're dealing with `module.exports = ...` or `[module.]exports.foo = ...` –
            // if this isn't top-level, we'll need to wrap the module
            if (programDepth > 3) {
              shouldWrap = true;
            } else if (
              exportsPatternMatch[1] === KEY_COMPILED_ESM &&
              !defineCompiledEsmExpression
            ) {
              defineCompiledEsmExpression = parent;
            }

            skippedNodes.add(node.left);

            // TODO Lukas can we get rid of __esModule if an object is assigned to module.exports?
            // or is this not needed as we would add it later anyway?
            if (flattened.keypath === 'module.exports' && node.right.type === 'ObjectExpression') {
              node.right.properties.forEach((prop) => {
                if (prop.computed || !('key' in prop) || prop.key.type !== 'Identifier') return;
                const { name } = prop.key;
                if (name === makeLegalIdentifier(name)) namedExports[name] = true;
              });
              return;
            }

            if (exportsPatternMatch[1]) namedExports[exportsPatternMatch[1]] = true;
          } else {
            for (const name of extractAssignedNames(node.left)) {
              reassignedNames.add(name);
            }
          }
          break;
        case 'CallExpression': {
          if (isDefineCompiledEsm(node)) {
            // TODO Lukas should we also check for the parent type?
            if (programDepth === 3 && !defineCompiledEsmExpression) {
              // skip special handling for [module.]exports until we know we render this
              skippedNodes.add(node.arguments[0]);
              defineCompiledEsmExpression = parent;
            } else {
              shouldWrap = true;
            }
            break;
          }
          const name = getDefinePropertyCallName(node, 'exports');
          if (name) {
            if (name === makeLegalIdentifier(name)) {
              namedExports[name] = true;
            }
            break;
          }
          if (
            isStaticRequireStatement(node, scope) &&
            !isIgnoredRequireStatement(node, ignoreRequire)
          ) {
            requireExpressionsAndScope.push({ node, scope });
            skippedNodes.add(node.callee);
            if (parent.type === 'ExpressionStatement') {
              // This is a bare import, e.g. `require('foo');`
              magicString.remove(parent.start, parent.end);
            } else {
              requireExpressionsWithUsedReturnValue.add(node);
              if (
                parent.type === 'VariableDeclarator' &&
                !scope.parent &&
                parent.id.type === 'Identifier'
              ) {
                // This will allow us to reuse this variable name as the imported variable if it is not reassigned
                // and does not conflict with variables in other places where this is imported
                // TODO Lukas test the latter
                topLevelRequireDeclarators.add(parent);
              }
            }
          }
          break;
        }
        case 'ConditionalExpression':
        case 'IfStatement':
          // skip dead branches
          if (isFalsy(node.test)) {
            skippedNodes.add(node.consequent);
          } else if (node.alternate && isTruthy(node.test)) {
            skippedNodes.add(node.alternate);
          }
          break;
        case 'Identifier':
          if (isReference(node, parent)) {
            const { name } = node;
            if (!scope.contains(name)) {
              switch (name) {
                case 'require':
                  if (
                    isNodeRequirePropertyAccess(parent) ||
                    (!isDynamicRequireModulesEnabled && isStaticRequireStatement(parent, scope))
                  ) {
                    break;
                  }

                  if (isDynamicRequireModulesEnabled && isRequireStatement(parent, scope)) {
                    magicString.appendLeft(
                      parent.end - 1,
                      `,${JSON.stringify(
                        dirname(id) === '.'
                          ? null /* default behavior */
                          : getVirtualPathForDynamicRequirePath(
                              normalizePathSlashes(dirname(id)),
                              commonDir
                            )
                      )}`
                    );
                  }

                  magicString.overwrite(node.start, node.end, `${HELPERS_NAME}.commonjsRequire`, {
                    storeName: true
                  });
                  usesCommonjsHelpers = true;
                  break;
                case 'module':
                case 'exports':
                  shouldWrap = true;
                  uses[name] = true;
                  break;
                case 'global':
                  uses.global = true;
                  if (!ignoreGlobal) {
                    magicString.overwrite(node.start, node.end, `${HELPERS_NAME}.commonjsGlobal`, {
                      storeName: true
                    });
                    usesCommonjsHelpers = true;
                  }
                  break;
                case 'define':
                  magicString.overwrite(node.start, node.end, 'undefined', { storeName: true });
                  break;
                default:
                  globals.add(name);
              }
            }
          }
          break;
        case 'ReturnStatement':
          // if top-level return, we need to wrap it
          if (lexicalDepth === 0) {
            shouldWrap = true;
          }
          break;
        case 'ThisExpression':
          // rewrite top-level `this` as `commonjsHelpers.commonjsGlobal`
          if (lexicalDepth === 0) {
            uses.global = true;
            if (!ignoreGlobal) {
              magicString.overwrite(node.start, node.end, `${HELPERS_NAME}.commonjsGlobal`, {
                storeName: true
              });
              usesCommonjsHelpers = true;
            }
          }
          break;
        case 'UnaryExpression':
          // rewrite `typeof module`, `typeof module.exports` and `typeof exports` (https://github.com/rollup/rollup-plugin-commonjs/issues/151)
          if (node.operator === 'typeof') {
            const flattened = getKeypath(node.argument);
            if (!flattened) return;

            if (scope.contains(flattened.name)) return;

            if (
              flattened.keypath === 'module.exports' ||
              flattened.keypath === 'module' ||
              flattened.keypath === 'exports'
            ) {
              magicString.overwrite(node.start, node.end, `'object'`, { storeName: false });
            }
          }
          break;
        case 'VariableDeclaration':
          if (!scope.parent) {
            topLevelDeclarations.push(node);
          }
          break;
        default:
      }
    },

    leave(node) {
      programDepth -= 1;
      if (node.scope) scope = scope.parent;
      if (functionType.test(node.type)) lexicalDepth -= 1;
    }
  });

  // TODO Lukas extract this later
  // First collect all required modules
  const requiredByNode = new Map();
  for (const { node, scope } of requireExpressionsAndScope) {
    // TODO Lukas maybe create the required in one go and also improve "importsDefault" name
    const required = getRequired(node, requireExpressionsWithUsedReturnValue.has(node));
    requiredByNode.set(node, { scope, required });
  }

  const removedDeclarators = new Set();
  // Then determine the used names and removed declarators
  for (const declarator of topLevelRequireDeclarators) {
    const { required } = requiredByNode.get(declarator.init);
    if (!(required.name || required.isDynamic)) {
      const potentialName = declarator.id.name;
      // TODO Lukas we also need to check that not
      // required.nodesUsingRequired.some(isUsedName) IF we can determine this is a local declaration
      // Basically rewrite "contains"
      if (!reassignedNames.has(potentialName)) {
        required.name = potentialName;
        // TODO Lukas test
        moduleScope[potentialName] = true;
        removedDeclarators.add(declarator);
      }
    }
  }

  let uid = 0;
  // Determine names where they are still missing and rewrite expressions
  for (const requireExpression of requireExpressionsWithUsedReturnValue) {
    const { required } = requiredByNode.get(requireExpression);
    if (shouldUseSimulatedRequire(required, id, dynamicRequireModuleSet)) {
      magicString.overwrite(
        requireExpression.start,
        requireExpression.end,
        `${HELPERS_NAME}.commonjsRequire(${JSON.stringify(
          getVirtualPathForDynamicRequirePath(normalizePathSlashes(required.source), commonDir)
        )}, ${JSON.stringify(
          dirname(id) === '.'
            ? null /* default behavior */
            : getVirtualPathForDynamicRequirePath(normalizePathSlashes(dirname(id)), commonDir)
        )})`
      );
      usesCommonjsHelpers = true;
    } else {
      if (!required.name) {
        let potentialName;
        const isUsedName = (node) => requiredByNode.get(node).scope.contains(potentialName);
        do {
          potentialName = `require$$${uid}`;
          uid += 1;
        } while (required.nodesUsingRequired.some(isUsedName));
        required.name = potentialName;
        moduleScope[potentialName] = true;
      }
      magicString.overwrite(requireExpression.start, requireExpression.end, required.name);
    }
  }

  // Rewrite declarations, checking which declarators can be removed by their init
  for (const declaration of topLevelDeclarations) {
    let keepDeclaration = false;
    let { start } = declaration.declarations[0];
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

  // If `isEsModule` is on, it means it has ES6 import/export statements,
  //   which just can't be wrapped in a function.
  shouldWrap = shouldWrap && !disableWrap && !isEsModule;

  if (defineCompiledEsmExpression) {
    if (shouldWrap) {
      uses.exports = true;
      defineCompiledEsmExpression = null;
    } else {
      magicString.remove(defineCompiledEsmExpression.start, defineCompiledEsmExpression.end);
    }
  }

  usesCommonjsHelpers = usesCommonjsHelpers || shouldWrap;

  if (
    !requiredSources.length &&
    !dynamicRegisterSources.length &&
    !uses.module &&
    !uses.exports &&
    !uses.require &&
    !usesCommonjsHelpers &&
    (ignoreGlobal || !uses.global)
  ) {
    return { meta: { commonjs: { isCommonJS: false } } };
  }

  const importBlock = `${(usesCommonjsHelpers
    ? [`import * as ${HELPERS_NAME} from '${HELPERS_ID}';`]
    : []
  )
    .concat(
      // dynamic registers first, as the may be required in the other modules
      dynamicRegisterSources.map((source) => `import '${source}';`),

      // now the actual modules so that they are analyzed before creating the proxies;
      // no need to do this for virtual modules as we never proxy them
      requiredSources
        .filter((source) => !source.startsWith('\0'))
        .map((source) => `import '${wrapId(source, REQUIRE_SUFFIX)}';`),

      // now the proxy modules
      requiredSources.map((source) => {
        const { name, nodesUsingRequired } = requiredBySource[source];
        return `import ${nodesUsingRequired.length ? `${name} from ` : ``}'${
          source.startsWith('\0') ? source : wrapId(source, PROXY_SUFFIX)
        }';`;
      })
    )
    .join('\n')}\n\n`;

  const namedExportDeclarations = [];
  let wrapperStart = '';
  let wrapperEnd = '';

  const moduleName = deconflict(scope, globals, getName(id));
  const defaultExportPropertyAssignments = [];
  let hasDefaultExport = false;
  let deconflictedDefaultExportName;

  if (shouldWrap) {
    const args = `module${uses.exports ? ', exports' : ''}`;

    wrapperStart = `var ${moduleName} = ${HELPERS_NAME}.createCommonjsModule(function (${args}) {\n`;

    wrapperEnd = `\n}`;
    if (isDynamicRequireModulesEnabled) {
      wrapperEnd += `, ${JSON.stringify(
        getVirtualPathForDynamicRequirePath(normalizePathSlashes(dirname(id)), commonDir)
      )}`;
    }

    wrapperEnd += `);`;
  } else {
    const names = [];

    // TODO Lukas
    //  * collect all relevant top-level AssignmentExpressions while analyzing above instead of looping again and repeating all the checks
    // * If there is more than one assignment, only the first becomes a declaration
    // * If there are nested assignments, create a separate declaration at the top
    // * Handle reading the variable
    for (const node of ast.body) {
      if (node.type === 'ExpressionStatement' && node.expression.type === 'AssignmentExpression') {
        const { left } = node.expression;
        const flattened = getKeypath(left);

        if (!flattened) {
          continue;
        }

        const match = exportsPattern.exec(flattened.keypath);
        if (!match) {
          continue;
        }

        if (flattened.keypath === 'module.exports') {
          hasDefaultExport = true;
          magicString.overwrite(left.start, left.end, `var ${moduleName}`);
        } else {
          const [, name] = match;

          if (name !== KEY_COMPILED_ESM) {
            const deconflicted = deconflict(scope, globals, name);

            names.push({ name, deconflicted });

            magicString.overwrite(node.start, left.end, `var ${deconflicted}`);

            const declaration =
              name === deconflicted
                ? `export { ${name} };`
                : `export { ${deconflicted} as ${name} };`;

            if (name !== 'default') {
              namedExportDeclarations.push({
                str: declaration,
                name
              });
            } else {
              deconflictedDefaultExportName = deconflicted;
            }

            defaultExportPropertyAssignments.push(`${moduleName}.${name} = ${deconflicted};`);
          } else {
            magicString.remove(node.start, node.end);
          }
        }
      }
    }

    // TODO Lukas maybe we can use getters for mutable values?
    if (!isEsModule && !hasDefaultExport) {
      const moduleExports = `{\n${names
        .map(({ name, deconflicted }) => `\t${name}: ${deconflicted}`)
        .join(',\n')}\n}`;
      wrapperEnd = `\n\nvar ${moduleName} = ${
        defineCompiledEsmExpression
          ? `/*#__PURE__*/Object.defineProperty(${moduleExports}, '__esModule', {value: true})`
          : moduleExports
      };`;
    }
  }

  if (!isEsModule) {
    const exportModuleExports = {
      str: `export { ${moduleName} as __moduleExports };`,
      name: '__moduleExports'
    };

    namedExportDeclarations.unshift(exportModuleExports);
  }

  magicString
    .trim()
    .prepend(importBlock + wrapperStart)
    .trim()
    .append(wrapperEnd);

  const defaultExport = [];
  if (defineCompiledEsmExpression && deconflictedDefaultExportName) {
    defaultExport.push(`export default ${deconflictedDefaultExportName};`);
  } else if (!isEsModule) {
    defaultExport.push(`export default ${moduleName};`);
  }

  const named = namedExportDeclarations
    .filter((x) => x.name !== 'default' || !hasDefaultExport)
    .map((x) => x.str);

  magicString.append(
    `\n\n${defaultExport
      .concat(named)
      .concat(hasDefaultExport ? defaultExportPropertyAssignments : [])
      .join('\n')}`
  );

  code = magicString.toString();
  const map = sourceMap ? magicString.generateMap() : null;

  return {
    code,
    map,
    syntheticNamedExports: isEsModule ? false : '__moduleExports',
    meta: { commonjs: { isCommonJS: !isEsModule } }
  };
}
