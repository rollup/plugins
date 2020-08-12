/* eslint-disable no-param-reassign, no-shadow, no-underscore-dangle, no-continue */

import { dirname, resolve } from 'path';

import { attachScopes, extractAssignedNames, makeLegalIdentifier } from '@rollup/pluginutils';
import { walk } from 'estree-walker';
import MagicString from 'magic-string';
import { sync as nodeResolveSync } from 'resolve';

import { flatten, isFalsy, isReference, isTruthy } from './ast-utils';
import {
  DYNAMIC_JSON_PREFIX,
  DYNAMIC_REGISTER_PREFIX,
  getVirtualPathForDynamicRequirePath,
  HELPERS_ID,
  PROXY_SUFFIX,
  REQUIRE_SUFFIX,
  wrapId
} from './helpers';
import { getName } from './utils';

const KEY_COMPILED_ESM = '__esModule';
const reserved = 'process location abstract arguments boolean break byte case catch char class const continue debugger default delete do double else enum eval export extends false final finally float for from function goto if implements import in instanceof int interface let long native new null package private protected public return short static super switch synchronized this throw throws transient true try typeof var void volatile while with yield'.split(
  ' '
);
const blacklist = { [KEY_COMPILED_ESM]: true };
reserved.forEach((word) => (blacklist[word] = true));

const exportsPattern = /^(?:module\.)?exports(?:\.([a-zA-Z_$][a-zA-Z_$0-9]*))?$/;

const firstpassGlobal = /\b(?:require|module|exports|global)\b/;
const firstpassNoGlobal = /\b(?:require|module|exports)\b/;
const functionType = /^(?:FunctionDeclaration|FunctionExpression|ArrowFunctionExpression)$/;

function deconflict(scope, globals, identifier) {
  let i = 1;
  let deconflicted = makeLegalIdentifier(identifier);

  while (scope.contains(deconflicted) || globals.has(deconflicted) || deconflicted in blacklist) {
    deconflicted = `${identifier}_${i}`;
    i += 1;
  }
  scope.declarations[deconflicted] = true;

  return deconflicted;
}

function tryParse(parse, code, id) {
  try {
    return parse(code, { allowReturnOutsideFunction: true });
  } catch (err) {
    err.message += ` in ${id}`;
    throw err;
  }
}

export function normalizePathSlashes(path) {
  return path.replace(/\\/g, '/');
}

export function hasCjsKeywords(code, ignoreGlobal) {
  const firstpass = ignoreGlobal ? firstpassNoGlobal : firstpassGlobal;
  return firstpass.test(code);
}

function isTrueNode(node) {
  if (!node) return false;

  switch (node.type) {
    case 'Literal':
      return node.value;
    case 'UnaryExpression':
      return node.operator === '!' && node.argument && node.argument.value === 0;
    default:
      return false;
  }
}

function getAssignedMember(node) {
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

  if (assignedIdentifier.name !== 'exports') {
    return null;
  }

  const key = left.property ? left.property.name : null;
  return { key, value: right };
}

export function checkEsModule(parse, code, id) {
  const ast = tryParse(parse, code, id);

  let isEsModule = false;
  let isCompiledEsModule = false;
  let hasDefaultExport = false;
  let hasNamedExports = false;
  for (const node of ast.body) {
    if (node.type === 'ExportDefaultDeclaration') {
      isEsModule = true;
      hasDefaultExport = true;
    } else if (node.type === 'ExportNamedDeclaration') {
      isEsModule = true;
      if (node.declaration) {
        hasNamedExports = true;
      } else {
        for (const specifier of node.specifiers) {
          if (specifier.exported.name === 'default') {
            hasDefaultExport = true;
          } else {
            hasNamedExports = true;
          }
        }
      }
    } else if (node.type === 'ExportAllDeclaration') {
      isEsModule = true;
      if (node.exported && node.exported.name === 'default') {
        hasDefaultExport = true;
      } else {
        hasNamedExports = true;
      }
    } else if (node.type === 'ImportDeclaration') {
      isEsModule = true;
    }

    if (node.type === 'ExpressionStatement' && node.expression) {
      let compiledEsmValueNode;

      if (node.expression.type === 'CallExpression') {
        // detect Object.defineProperty(exports, '__esModule', { value: true });
        const p = getDefinePropertyCallName(node.expression, 'exports');
        if (p && p.key === KEY_COMPILED_ESM) {
          compiledEsmValueNode = p.value;
        }
      } else if (node.expression.type === 'AssignmentExpression') {
        // detect exports.__esModule = true;
        const assignedMember = getAssignedMember(node);
        if (assignedMember && assignedMember.key === KEY_COMPILED_ESM) {
          compiledEsmValueNode = assignedMember.value;
        }
      }

      if (compiledEsmValueNode) {
        isCompiledEsModule = isTrueNode(compiledEsmValueNode);
      }
    }
  }

  // don't treat mixed es modules as compiled es mdoules
  if (isEsModule) {
    isCompiledEsModule = false;
  }

  return { isEsModule, isCompiledEsModule, hasDefaultExport, hasNamedExports, ast };
}

function getDefinePropertyCallName(node, targetName) {
  if (node.type !== 'CallExpression') return;

  const {
    callee: { object, property }
  } = node;

  if (!object || object.type !== 'Identifier' || object.name !== 'Object') return;

  if (!property || property.type !== 'Identifier' || property.name !== 'defineProperty') return;

  if (node.arguments.length !== 3) return;

  const [target, key, value] = node.arguments;
  if (target.type !== 'Identifier' || target.name !== targetName) return;

  if (value.type !== 'ObjectExpression' || !value.properties) return;
  const valueProperty = value.properties.find((p) => p.key && p.key.name === 'value');
  if (!valueProperty || !valueProperty.value) return;

  // eslint-disable-next-line consistent-return
  return { key: key.value, value: valueProperty.value };
}

export function transformCommonjs(
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
  const assignedTo = new Set();
  walk(ast, {
    enter(node) {
      if (node.type !== 'AssignmentExpression') return;
      if (node.left.type === 'MemberExpression') return;

      extractAssignedNames(node.left).forEach((name) => {
        assignedTo.add(name);
      });
    }
  });

  walk(ast, {
    enter(node, parent) {
      if (sourceMap) {
        magicString.addSourcemapLocation(node.start);
        magicString.addSourcemapLocation(node.end);
      }

      // skip dead branches
      if (parent && (parent.type === 'IfStatement' || parent.type === 'ConditionalExpression')) {
        if (node === parent.consequent && isFalsy(parent.test)) {
          this.skip();
          return;
        }
        if (node === parent.alternate && isTruthy(parent.test)) {
          this.skip();
          return;
        }
      }

      if (node._skip) {
        this.skip();
        return;
      }

      programDepth += 1;

      if (node.scope) ({ scope } = node);
      if (functionType.test(node.type)) lexicalDepth += 1;

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
        const flattened = flatten(node.argument);
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

        const flattened = flatten(node.left);
        if (!flattened) return;

        if (scope.contains(flattened.name)) return;

        const match = exportsPattern.exec(flattened.keypath);
        if (!match || flattened.keypath === 'exports') return;

        uses[flattened.name] = true;

        // we're dealing with `module.exports = ...` or `[module.]exports.foo = ...` –
        // if this isn't top-level, we'll need to wrap the module
        if (programDepth > 3) shouldWrap = true;

        node.left._skip = true;

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

      if (node.type === 'ExpressionStatement' && node.expression) {
        const p = getDefinePropertyCallName(node.expression, 'exports');
        if (p && p.key === makeLegalIdentifier(p.key)) namedExports[p.key] = true;
        if (p && p.key === KEY_COMPILED_ESM) node._shouldRemove = true;
      }

      // if this is `var x = require('x')`, we can do `import x from 'x'`
      if (
        node.type === 'VariableDeclarator' &&
        node.id.type === 'Identifier' &&
        isStaticRequireStatement(node.init) &&
        !isIgnoredRequireStatement(node.init)
      ) {
        // for now, only do this for top-level requires. maybe fix this in future
        if (scope.parent) return;

        // edge case — CJS allows you to assign to imports. ES doesn't
        if (assignedTo.has(node.id.name)) return;

        const required = getRequired(node.init, node.id.name);
        required.importsDefault = true;

        if (required.name === node.id.name && !required.isDynamic) {
          node._shouldRemove = true;
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

      node.callee._skip = true;
    },

    leave(node) {
      programDepth -= 1;
      if (node.scope) scope = scope.parent;
      if (functionType.test(node.type)) lexicalDepth -= 1;

      if (node.type === 'VariableDeclaration') {
        let keepDeclaration = false;
        let c = node.declarations[0].start;

        for (let i = 0; i < node.declarations.length; i += 1) {
          const declarator = node.declarations[i];

          if (declarator._shouldRemove) {
            magicString.remove(c, declarator.end);
          } else {
            if (!keepDeclaration) {
              magicString.remove(c, declarator.start);
              keepDeclaration = true;
            }

            c = declarator.end;
          }
        }

        if (!keepDeclaration) {
          magicString.remove(node.start, node.end);
        }
      } else if (node.type === 'ExpressionStatement') {
        if (node._shouldRemove) {
          magicString.remove(node.start, node.end);
        }
      }
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
  if (!isEsModule && !isCompiledEsModule) {
    const exportModuleExports = {
      str: `export { ${moduleName} as __moduleExports };`,
      name: '__moduleExports'
    };

    namedExportDeclarations.push(exportModuleExports);
  }

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

    for (const node of ast.body) {
      if (node.type === 'ExpressionStatement' && node.expression.type === 'AssignmentExpression') {
        const { left } = node.expression;
        const flattened = flatten(left);

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

    if (!(isEsModule || isCompiledEsModule || hasDefaultExport)) {
      wrapperEnd = `\n\nvar ${moduleName} = {\n${names
        .map(({ name, deconflicted }) => `\t${name}: ${deconflicted}`)
        .join(',\n')}\n};`;
    }
  }

  magicString
    .trim()
    .prepend(importBlock + wrapperStart)
    .trim()
    .append(wrapperEnd);

  const defaultExport = [];
  if (isCompiledEsModule) {
    if (deconflictedDefaultExportName) {
      defaultExport.push(`export default ${deconflictedDefaultExportName};`);
    }
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
