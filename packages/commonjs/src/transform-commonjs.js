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
  isRequireIdentifier,
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
  let scope = attachScopes(ast, 'scope');
  const uses = { module: false, exports: false, global: false, require: false };
  let lexicalDepth = 0;
  let programDepth = 0;
  let shouldWrap = false;
  let usesCommonjsHelpers = false;
  let isCompiledEsModule = false;
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

  // do a first pass, see which names are assigned to. This is necessary to prevent
  // illegally replacing `var foo = require('foo')` with `import foo from 'foo'`,
  // where `foo` is later reassigned. (This happens in the wild. CommonJS, sigh)
  const reassignedNames = new Set();
  const removedDeclaratorsIfNotReassigned = new Set();

  const skippedNodes = new Set();

  walk(ast, {
    enter(node, parent) {
      if (skippedNodes.has(node)) {
        this.skip();
        return;
      }

      // detect expressions such as Object.defineProperty(exports, '__esModule', { value: true });
      if (node.type === 'CallExpression' && isDefineCompiledEsm(node)) {
        if (programDepth === 2 && !defineCompiledEsmExpression) {
          defineCompiledEsmExpression = parent;
          isCompiledEsModule = true;
        } else {
          shouldWrap = true;
        }
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

      // skip dead branches
      if (node.type === 'IfStatement' || node.type === 'ConditionalExpression') {
        if (isFalsy(node.test)) {
          skippedNodes.add(node.consequent);
        } else if (node.alternate && isTruthy(node.test)) {
          skippedNodes.add(node.alternate);
        }
      }

      // if toplevel return, we need to wrap it
      if (node.type === 'ReturnStatement' && lexicalDepth === 0) {
        shouldWrap = true;
      }

      // rewrite `this` as `commonjsHelpers.commonjsGlobal`
      if (node.type === 'ThisExpression' && lexicalDepth === 0) {
        uses.global = true;
        if (!ignoreGlobal) {
          magicString.overwrite(node.start, node.end, `${HELPERS_NAME}.commonjsGlobal`, {
            storeName: true
          });
          usesCommonjsHelpers = true;
        }
        return;
      }

      if (node.type !== 'AssignmentExpression') return;
      if (node.left.type === 'MemberExpression') return;

      extractAssignedNames(node.left).forEach((name) => reassignedNames.add(name));
    },

    leave(node) {
      programDepth -= 1;
      if (node.scope) scope = scope.parent;
      if (functionType.test(node.type)) lexicalDepth -= 1;
    }
  });

  walk(ast, {
    enter(node, parent) {
      if (skippedNodes.has(node)) {
        this.skip();
        return;
      }

      // TODO Lukas why do we need to skip? Can we do this later instead?
      if (node.type === 'CallExpression' && isDefineCompiledEsm(node)) {
        this.skip();
        return;
      }

      programDepth += 1;
      if (node.scope) ({ scope } = node);
      if (functionType.test(node.type)) lexicalDepth += 1;

      // rewrite `typeof module`, `typeof module.exports` and `typeof exports` (https://github.com/rollup/rollup-plugin-commonjs/issues/151)
      if (node.type === 'UnaryExpression' && node.operator === 'typeof') {
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

      // rewrite `require` (if not already handled) `global` and `define`, and handle free references to
      // `module` and `exports` as these mean we need to wrap the module in commonjsHelpers.createCommonjsModule
      if (node.type === 'Identifier') {
        if (isReference(node, parent) && !scope.contains(node.name)) {
          if (node.name in uses) {
            if (isRequireIdentifier(node, scope)) {
              if (isNodeRequirePropertyAccess(parent)) {
                return;
              }

              if (!isDynamicRequireModulesEnabled && isStaticRequireStatement(parent, scope)) {
                return;
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
            }

            uses[node.name] = true;
            if (node.name === 'global' && !ignoreGlobal) {
              magicString.overwrite(node.start, node.end, `${HELPERS_NAME}.commonjsGlobal`, {
                storeName: true
              });
              usesCommonjsHelpers = true;
            }

            // if module or exports are used outside the context of an assignment
            // expression, we need to wrap the module
            if (node.name === 'module' || node.name === 'exports') {
              shouldWrap = true;
            }
          }

          if (node.name === 'define') {
            magicString.overwrite(node.start, node.end, 'undefined', { storeName: true });
          }

          globals.add(node.name);
        }

        return;
      }

      // Is this an assignment to exports or module.exports?
      if (node.type === 'AssignmentExpression') {
        if (node.left.type !== 'MemberExpression') return;

        const flattened = getKeypath(node.left);
        if (!flattened) return;

        if (scope.contains(flattened.name)) return;

        const match = exportsPattern.exec(flattened.keypath);
        if (!match || flattened.keypath === 'exports') return;

        // TODO Lukas do not declare we are using module or exports unless we do
        // not remove this
        uses[flattened.name] = true;

        // we're dealing with `module.exports = ...` or `[module.]exports.foo = ...` –
        // if this isn't top-level, we'll need to wrap the module
        if (programDepth > 3) {
          shouldWrap = true;
        } else if (match[1] === KEY_COMPILED_ESM && !defineCompiledEsmExpression) {
          defineCompiledEsmExpression = parent;
          isCompiledEsModule = true;
        }

        skippedNodes.add(node.left);

        // TODO Lukas can we get rid of __esModule here?
        if (flattened.keypath === 'module.exports' && node.right.type === 'ObjectExpression') {
          node.right.properties.forEach((prop) => {
            if (prop.computed || !('key' in prop) || prop.key.type !== 'Identifier') return;
            const { name } = prop.key;
            if (name === makeLegalIdentifier(name)) namedExports[name] = true;
          });
          return;
        }

        if (match[1]) namedExports[match[1]] = true;
        return;
      }

      const name = getDefinePropertyCallName(node, 'exports');
      if (name && name === makeLegalIdentifier(name)) namedExports[name] = true;

      // if this is a top level `var x = require('x')`, we can do `import x from 'x'`
      if (
        node.type === 'VariableDeclarator' &&
        node.id.type === 'Identifier' &&
        isStaticRequireStatement(node.init, scope) &&
        !isIgnoredRequireStatement(node.init, ignoreRequire) &&
        !scope.parent
      ) {
        // edge case — CJS allows you to assign to imports. ES doesn't
        if (reassignedNames.has(node.id.name)) return;

        const required = getRequired(node.init, scope, node.id.name);
        required.importsDefault = true;

        if (required.name === node.id.name && !required.isDynamic) {
          removedDeclaratorsIfNotReassigned.add(node);
        }
      }

      if (
        !isStaticRequireStatement(node, scope) ||
        isIgnoredRequireStatement(node, ignoreRequire)
      ) {
        return;
      }

      const required = getRequired(node, scope);

      if (parent.type === 'ExpressionStatement') {
        // is a bare import, e.g. `require('foo');`
        magicString.remove(parent.start, parent.end);
      } else {
        required.importsDefault = true;

        if (shouldUseSimulatedRequire(required, id, dynamicRequireModuleSet)) {
          magicString.overwrite(
            node.start,
            node.end,
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
          magicString.overwrite(node.start, node.end, required.name);
        }
      }

      skippedNodes.add(node.callee);
    },

    leave(node) {
      if (node.type === 'VariableDeclaration' && !scope.parent) {
        let keepDeclaration = false;
        let { start } = node.declarations[0];

        for (const declarator of node.declarations) {
          if (removedDeclaratorsIfNotReassigned.has(declarator)) {
            magicString.remove(start, declarator.end);
          } else if (!keepDeclaration) {
            magicString.remove(start, declarator.start);
            keepDeclaration = true;
          }
          start = declarator.end;
        }

        if (!keepDeclaration) {
          magicString.remove(node.start, node.end);
        }
      }
      programDepth -= 1;
      if (node.scope) scope = scope.parent;
      if (functionType.test(node.type)) lexicalDepth -= 1;
    }
  });

  // If `isEsModule` is on, it means it has ES6 import/export statements,
  //   which just can't be wrapped in a function.
  shouldWrap = shouldWrap && !disableWrap && !isEsModule;

  if (defineCompiledEsmExpression && !shouldWrap) {
    magicString.remove(defineCompiledEsmExpression.start, defineCompiledEsmExpression.end);
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
        const { name, importsDefault } = requiredBySource[source];
        return `import ${importsDefault ? `${name} from ` : ``}'${
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
          // direct assignment to module.exports overwrites any previously set __esModule value
          isCompiledEsModule = false;
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

    const exportsDefault = hasDefaultExport || !!deconflictedDefaultExportName;
    if (!isEsModule && !hasDefaultExport && (!isCompiledEsModule || !exportsDefault)) {
      wrapperEnd = `\n\nvar ${moduleName} = {\n${names
        .map(({ name, deconflicted }) => `\t${name}: ${deconflicted}`)
        .join(',\n')}\n};`;
    }
  }

  if (!isEsModule && !isCompiledEsModule) {
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
  if (isCompiledEsModule && deconflictedDefaultExportName) {
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
    syntheticNamedExports: isEsModule || isCompiledEsModule ? false : '__moduleExports',
    meta: { commonjs: { isCommonJS: !isEsModule && !isCompiledEsModule } }
  };
}
