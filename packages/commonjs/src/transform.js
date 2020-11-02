/* eslint-disable no-param-reassign, no-shadow, no-underscore-dangle, no-continue */

import { dirname, resolve } from 'path';

import { attachScopes, extractAssignedNames, makeLegalIdentifier } from '@rollup/pluginutils';
import { walk } from 'estree-walker';
import MagicString from 'magic-string';
import { sync as nodeResolveSync } from 'resolve';

import {
  getKeypath,
  getDefinePropertyCallName,
  isDefineCompiledEsm,
  isFalsy,
  isReference,
  isTruthy,
  KEY_COMPILED_ESM
} from './ast-utils';
import {
  DYNAMIC_JSON_PREFIX,
  DYNAMIC_REGISTER_PREFIX,
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
  isCompiledEsModule,
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

  const required = {};
  // Because objects have no guaranteed ordering, yet we need it,
  // we need to keep track of the order in a array
  const requiredSources = [];
  const dynamicRegisterSources = [];

  let uid = 0;

  let scope = attachScopes(ast, 'scope');
  const uses = { module: false, exports: false, global: false, require: false };

  let lexicalDepth = 0;
  let programDepth = 0;

  const globals = new Set();

  // TODO technically wrong since globals isn't populated yet, but ¯\_(ツ)_/¯
  const HELPERS_NAME = deconflict(scope, globals, 'commonjsHelpers');
  const namedExports = {};

  let shouldWrap = false;
  let usesCommonjsHelpers = false;

  function isRequireStatement(node) {
    if (!node) return false;
    if (node.type !== 'CallExpression') return false;

    // Weird case of `require()` or `module.require()` without arguments
    if (node.arguments.length === 0) return false;

    return isRequireIdentifier(node.callee);
  }

  function isRequireIdentifier(node) {
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

  function hasDynamicArguments(node) {
    return (
      node.arguments.length > 1 ||
      (node.arguments[0].type !== 'Literal' &&
        (node.arguments[0].type !== 'TemplateLiteral' || node.arguments[0].expressions.length > 0))
    );
  }

  function isStaticRequireStatement(node) {
    if (!isRequireStatement(node)) return false;
    return !hasDynamicArguments(node);
  }

  function isNodeRequireStatement(parent) {
    const reservedMethod = ['resolve', 'cache', 'main'];
    return !!(parent && parent.property && reservedMethod.indexOf(parent.property.name) > -1);
  }

  function isIgnoredRequireStatement(requiredNode) {
    return ignoreRequire(requiredNode.arguments[0].value);
  }

  function getRequireStringArg(node) {
    return node.arguments[0].type === 'Literal'
      ? node.arguments[0].value
      : node.arguments[0].quasis[0].value.cooked;
  }

  function getRequired(node, name) {
    let sourceId = getRequireStringArg(node);
    const isDynamicRegister = sourceId.startsWith(DYNAMIC_REGISTER_PREFIX);
    if (isDynamicRegister) {
      sourceId = sourceId.substr(DYNAMIC_REGISTER_PREFIX.length);
    }

    const existing = required[sourceId];
    if (!existing) {
      const isDynamic = hasDynamicModuleForPath(sourceId);

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

      required[sourceId] = { source: sourceId, name, importsDefault: false, isDynamic };
    }

    return required[sourceId];
  }

  function hasDynamicModuleForPath(source) {
    if (!/^(?:\.{0,2}[/\\]|[A-Za-z]:[/\\])/.test(source)) {
      try {
        const resolvedPath = normalizePathSlashes(
          nodeResolveSync(source, { basedir: dirname(id) })
        );
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

  function shouldUseSimulatedRequire(required) {
    return (
      hasDynamicModuleForPath(required.source) &&
      // We only do `commonjsRequire` for json if it's the `commonjsRegister` call.
      (required.source.startsWith(DYNAMIC_REGISTER_PREFIX) || !required.source.endsWith('.json'))
    );
  }

  // do a first pass, see which names are assigned to. This is necessary to prevent
  // illegally replacing `var foo = require('foo')` with `import foo from 'foo'`,
  // where `foo` is later reassigned. (This happens in the wild. CommonJS, sigh)
  const reassignedNames = new Set();
  const removedDeclaratorsIfNotReassigned = new Set();

  walk(ast, {
    enter(node) {
      if (node.type !== 'AssignmentExpression') return;
      if (node.left.type === 'MemberExpression') return;

      extractAssignedNames(node.left).forEach((name) => reassignedNames.add(name));
    }
  });

  const skippedNodes = new Set();

  walk(ast, {
    enter(node, parent) {
      if (skippedNodes.has(node)) {
        this.skip();
        return;
      }

      // TODO Lukas only do this if we are sure we will not wrap
      // => determine this during first pass!
      // skip and remove expressions such as Object.defineProperty(exports, '__esModule', { value: true });
      if (node.type === 'CallExpression' && isDefineCompiledEsm(node)) {
        magicString.remove(parent.start, parent.end);
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
            if (isRequireIdentifier(node)) {
              if (isNodeRequireStatement(parent)) {
                return;
              }

              if (!isDynamicRequireModulesEnabled && isStaticRequireStatement(parent)) {
                return;
              }

              if (isDynamicRequireModulesEnabled && isRequireStatement(parent)) {
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

        uses[flattened.name] = true;

        // we're dealing with `module.exports = ...` or `[module.]exports.foo = ...` –
        // if this isn't top-level, we'll need to wrap the module
        if (programDepth > 3) {
          shouldWrap = true;
        }

        skippedNodes.add(node.left);

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
        isStaticRequireStatement(node.init) &&
        !isIgnoredRequireStatement(node.init) &&
        !scope.parent
      ) {
        // edge case — CJS allows you to assign to imports. ES doesn't
        if (reassignedNames.has(node.id.name)) return;

        const required = getRequired(node.init, node.id.name);
        required.importsDefault = true;

        if (required.name === node.id.name && !required.isDynamic) {
          removedDeclaratorsIfNotReassigned.add(node);
        }
      }

      if (!isStaticRequireStatement(node) || isIgnoredRequireStatement(node)) {
        return;
      }

      const required = getRequired(node);

      if (parent.type === 'ExpressionStatement') {
        // is a bare import, e.g. `require('foo');`
        magicString.remove(parent.start, parent.end);
      } else {
        required.importsDefault = true;

        if (shouldUseSimulatedRequire(required)) {
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
  shouldWrap = shouldWrap && !disableWrap && !isEsModule && !isCompiledEsModule;

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
        const { name, importsDefault } = required[source];
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
