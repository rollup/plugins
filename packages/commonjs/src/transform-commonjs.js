/* eslint-disable no-param-reassign, no-shadow, no-underscore-dangle, no-continue */

import { dirname } from 'path';

import { attachScopes, extractAssignedNames } from '@rollup/pluginutils';
import { walk } from 'estree-walker';
import MagicString from 'magic-string';

import {
  getKeypath,
  isDefineCompiledEsm,
  hasDefineEsmProperty,
  isFalsy,
  isReference,
  isShorthandProperty,
  isTruthy,
  KEY_COMPILED_ESM
} from './ast-utils';
import { rewriteExportsAndGetExportsBlock, wrapCode } from './generate-exports';
import {
  getRequireHandlers,
  getRequireStringArg,
  hasDynamicModuleForPath,
  isIgnoredRequireStatement,
  isModuleRequire,
  isNodeRequirePropertyAccess,
  isRequireStatement,
  isStaticRequireStatement
} from './generate-imports';
import {
  DYNAMIC_JSON_PREFIX,
  DYNAMIC_REGISTER_SUFFIX,
  isWrappedId,
  unwrapId,
  wrapId
} from './helpers';
import { tryParse } from './parse';
import { deconflict, getName, getVirtualPathForDynamicRequirePath } from './utils';

const exportsPattern = /^(?:module\.)?exports(?:\.([a-zA-Z_$][a-zA-Z_$0-9]*))?$/;

const functionType = /^(?:FunctionDeclaration|FunctionExpression|ArrowFunctionExpression)$/;

export default function transformCommonjs(
  parse,
  code,
  id,
  isEsModule,
  ignoreGlobal,
  ignoreRequire,
  ignoreDynamicRequires,
  getIgnoreTryCatchRequireStatementMode,
  sourceMap,
  isDynamicRequireModulesEnabled,
  dynamicRequireModuleSet,
  disableWrap,
  commonDir,
  astCache,
  defaultIsModuleExports
) {
  const ast = astCache || tryParse(parse, code, id);
  const magicString = new MagicString(code);
  const uses = {
    module: false,
    exports: false,
    global: false,
    require: false
  };
  let usesDynamicRequire = false;
  const virtualDynamicRequirePath =
    isDynamicRequireModulesEnabled && getVirtualPathForDynamicRequirePath(dirname(id), commonDir);
  let scope = attachScopes(ast, 'scope');
  let lexicalDepth = 0;
  let programDepth = 0;
  let currentTryBlockEnd = null;
  let shouldWrap = false;

  const globals = new Set();

  // TODO technically wrong since globals isn't populated yet, but ¯\_(ツ)_/¯
  const HELPERS_NAME = deconflict([scope], globals, 'commonjsHelpers');
  const dynamicRegisterSources = new Set();
  let hasRemovedRequire = false;

  const { addRequireStatement, requiredSources, rewriteRequireExpressionsAndGetImportBlock } =
    getRequireHandlers();

  // See which names are assigned to. This is necessary to prevent
  // illegally replacing `var foo = require('foo')` with `import foo from 'foo'`,
  // where `foo` is later reassigned. (This happens in the wild. CommonJS, sigh)
  const reassignedNames = new Set();
  const topLevelDeclarations = [];
  const topLevelRequireDeclarators = new Set();
  const skippedNodes = new Set();
  const moduleAccessScopes = new Set([scope]);
  const exportsAccessScopes = new Set([scope]);
  const moduleExportsAssignments = [];
  let firstTopLevelModuleExportsAssignment = null;
  const exportsAssignmentsByName = new Map();
  const topLevelAssignments = new Set();
  const topLevelDefineCompiledEsmExpressions = [];

  walk(ast, {
    enter(node, parent) {
      if (skippedNodes.has(node)) {
        this.skip();
        return;
      }

      if (currentTryBlockEnd !== null && node.start > currentTryBlockEnd) {
        currentTryBlockEnd = null;
      }

      programDepth += 1;
      if (node.scope) ({ scope } = node);
      if (functionType.test(node.type)) lexicalDepth += 1;
      if (sourceMap) {
        magicString.addSourcemapLocation(node.start);
        magicString.addSourcemapLocation(node.end);
      }

      // eslint-disable-next-line default-case
      switch (node.type) {
        case 'TryStatement':
          if (currentTryBlockEnd === null) {
            currentTryBlockEnd = node.block.end;
          }
          return;
        case 'AssignmentExpression':
          if (node.left.type === 'MemberExpression') {
            const flattened = getKeypath(node.left);
            if (!flattened || scope.contains(flattened.name)) return;

            const exportsPatternMatch = exportsPattern.exec(flattened.keypath);
            if (!exportsPatternMatch || flattened.keypath === 'exports') return;

            const [, exportName] = exportsPatternMatch;
            uses[flattened.name] = true;

            // we're dealing with `module.exports = ...` or `[module.]exports.foo = ...` –
            if (flattened.keypath === 'module.exports') {
              moduleExportsAssignments.push(node);
              if (programDepth > 3) {
                moduleAccessScopes.add(scope);
              } else if (!firstTopLevelModuleExportsAssignment) {
                firstTopLevelModuleExportsAssignment = node;
              }

              if (defaultIsModuleExports === false) {
                shouldWrap = true;
              } else if (defaultIsModuleExports === 'auto') {
                if (node.right.type === 'ObjectExpression') {
                  if (hasDefineEsmProperty(node.right)) {
                    shouldWrap = true;
                  }
                } else if (defaultIsModuleExports === false) {
                  shouldWrap = true;
                }
              }
            } else if (exportName === KEY_COMPILED_ESM) {
              if (programDepth > 3) {
                shouldWrap = true;
              } else {
                topLevelDefineCompiledEsmExpressions.push(node);
              }
            } else {
              const exportsAssignments = exportsAssignmentsByName.get(exportName) || {
                nodes: [],
                scopes: new Set()
              };
              exportsAssignments.nodes.push(node);
              exportsAssignments.scopes.add(scope);
              exportsAccessScopes.add(scope);
              exportsAssignmentsByName.set(exportName, exportsAssignments);
              if (programDepth <= 3) {
                topLevelAssignments.add(node);
              }
            }

            skippedNodes.add(node.left);
          } else {
            for (const name of extractAssignedNames(node.left)) {
              reassignedNames.add(name);
            }
          }
          return;
        case 'CallExpression': {
          if (isDefineCompiledEsm(node)) {
            if (programDepth === 3 && parent.type === 'ExpressionStatement') {
              // skip special handling for [module.]exports until we know we render this
              skippedNodes.add(node.arguments[0]);
              topLevelDefineCompiledEsmExpressions.push(node);
            } else {
              shouldWrap = true;
            }
            return;
          }

          if (
            node.callee.object &&
            node.callee.object.name === 'require' &&
            node.callee.property.name === 'resolve' &&
            hasDynamicModuleForPath(id, '/', dynamicRequireModuleSet)
          ) {
            const requireNode = node.callee.object;
            magicString.appendLeft(
              node.end - 1,
              `,${JSON.stringify(
                dirname(id) === '.' ? null /* default behavior */ : virtualDynamicRequirePath
              )}`
            );
            magicString.overwrite(
              requireNode.start,
              requireNode.end,
              `${HELPERS_NAME}.commonjsRequire`,
              {
                storeName: true
              }
            );
            return;
          }

          if (!isStaticRequireStatement(node, scope)) return;
          if (!isDynamicRequireModulesEnabled) {
            skippedNodes.add(node.callee);
          }
          if (!isIgnoredRequireStatement(node, ignoreRequire)) {
            skippedNodes.add(node.callee);
            const usesReturnValue = parent.type !== 'ExpressionStatement';

            let canConvertRequire = true;
            let shouldRemoveRequireStatement = false;

            if (currentTryBlockEnd !== null) {
              ({ canConvertRequire, shouldRemoveRequireStatement } =
                getIgnoreTryCatchRequireStatementMode(node.arguments[0].value));

              if (shouldRemoveRequireStatement) {
                hasRemovedRequire = true;
              }
            }

            let sourceId = getRequireStringArg(node);
            const isDynamicRegister = isWrappedId(sourceId, DYNAMIC_REGISTER_SUFFIX);
            if (isDynamicRegister) {
              sourceId = unwrapId(sourceId, DYNAMIC_REGISTER_SUFFIX);
              if (sourceId.endsWith('.json')) {
                sourceId = DYNAMIC_JSON_PREFIX + sourceId;
              }
              dynamicRegisterSources.add(wrapId(sourceId, DYNAMIC_REGISTER_SUFFIX));
            } else {
              if (
                !sourceId.endsWith('.json') &&
                hasDynamicModuleForPath(sourceId, id, dynamicRequireModuleSet)
              ) {
                if (shouldRemoveRequireStatement) {
                  magicString.overwrite(node.start, node.end, `undefined`);
                } else if (canConvertRequire) {
                  magicString.overwrite(
                    node.start,
                    node.end,
                    `${HELPERS_NAME}.commonjsRequire(${JSON.stringify(
                      getVirtualPathForDynamicRequirePath(sourceId, commonDir)
                    )}, ${JSON.stringify(
                      dirname(id) === '.' ? null /* default behavior */ : virtualDynamicRequirePath
                    )})`
                  );
                  usesDynamicRequire = true;
                }
                return;
              }

              if (canConvertRequire) {
                addRequireStatement(sourceId, node, scope, usesReturnValue);
              }
            }

            if (usesReturnValue) {
              if (shouldRemoveRequireStatement) {
                magicString.overwrite(node.start, node.end, `undefined`);
                return;
              }

              if (
                parent.type === 'VariableDeclarator' &&
                !scope.parent &&
                parent.id.type === 'Identifier'
              ) {
                // This will allow us to reuse this variable name as the imported variable if it is not reassigned
                // and does not conflict with variables in other places where this is imported
                topLevelRequireDeclarators.add(parent);
              }
            } else {
              // This is a bare import, e.g. `require('foo');`

              if (!canConvertRequire && !shouldRemoveRequireStatement) {
                return;
              }

              magicString.remove(parent.start, parent.end);
            }
          }
          return;
        }
        case 'ConditionalExpression':
        case 'IfStatement':
          // skip dead branches
          if (isFalsy(node.test)) {
            skippedNodes.add(node.consequent);
          } else if (node.alternate && isTruthy(node.test)) {
            skippedNodes.add(node.alternate);
          }
          return;
        case 'Identifier': {
          const { name } = node;
          if (!(isReference(node, parent) && !scope.contains(name))) return;
          switch (name) {
            case 'require':
              if (isNodeRequirePropertyAccess(parent)) {
                if (hasDynamicModuleForPath(id, '/', dynamicRequireModuleSet)) {
                  if (parent.property.name === 'cache') {
                    magicString.overwrite(node.start, node.end, `${HELPERS_NAME}.commonjsRequire`, {
                      storeName: true
                    });
                  }
                }

                return;
              }

              if (isDynamicRequireModulesEnabled && isRequireStatement(parent, scope)) {
                magicString.appendLeft(
                  parent.end - 1,
                  `,${JSON.stringify(
                    dirname(id) === '.' ? null /* default behavior */ : virtualDynamicRequirePath
                  )}`
                );
              }
              if (!ignoreDynamicRequires) {
                if (isShorthandProperty(parent)) {
                  magicString.appendRight(node.end, `: ${HELPERS_NAME}.commonjsRequire`);
                } else {
                  magicString.overwrite(node.start, node.end, `${HELPERS_NAME}.commonjsRequire`, {
                    storeName: true
                  });
                }
              }
              usesDynamicRequire = true;
              return;
            case 'module':
            case 'exports':
              shouldWrap = true;
              uses[name] = true;
              return;
            case 'global':
              uses.global = true;
              if (!ignoreGlobal) {
                magicString.overwrite(node.start, node.end, `${HELPERS_NAME}.commonjsGlobal`, {
                  storeName: true
                });
              }
              return;
            case 'define':
              magicString.overwrite(node.start, node.end, 'undefined', {
                storeName: true
              });
              return;
            default:
              globals.add(name);
              return;
          }
        }
        case 'MemberExpression':
          if (!isDynamicRequireModulesEnabled && isModuleRequire(node, scope)) {
            magicString.overwrite(node.start, node.end, `${HELPERS_NAME}.commonjsRequire`, {
              storeName: true
            });
            skippedNodes.add(node.object);
            skippedNodes.add(node.property);
          }
          return;
        case 'ReturnStatement':
          // if top-level return, we need to wrap it
          if (lexicalDepth === 0) {
            shouldWrap = true;
          }
          return;
        case 'ThisExpression':
          // rewrite top-level `this` as `commonjsHelpers.commonjsGlobal`
          if (lexicalDepth === 0) {
            uses.global = true;
            if (!ignoreGlobal) {
              magicString.overwrite(node.start, node.end, `${HELPERS_NAME}.commonjsGlobal`, {
                storeName: true
              });
            }
          }
          return;
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
              magicString.overwrite(node.start, node.end, `'object'`, {
                storeName: false
              });
            }
          }
          return;
        case 'VariableDeclaration':
          if (!scope.parent) {
            topLevelDeclarations.push(node);
          }
      }
    },

    leave(node) {
      programDepth -= 1;
      if (node.scope) scope = scope.parent;
      if (functionType.test(node.type)) lexicalDepth -= 1;
    }
  });

  const nameBase = getName(id);
  const exportsName = deconflict([...exportsAccessScopes], globals, nameBase);
  const moduleName = deconflict([...moduleAccessScopes], globals, `${nameBase}Module`);
  const deconflictedExportNames = Object.create(null);
  for (const [exportName, { scopes }] of exportsAssignmentsByName) {
    deconflictedExportNames[exportName] = deconflict([...scopes], globals, exportName);
  }

  // We cannot wrap ES/mixed modules
  shouldWrap =
    !isEsModule &&
    !disableWrap &&
    (shouldWrap || (uses.exports && moduleExportsAssignments.length > 0));
  const detectWrappedDefault =
    shouldWrap &&
    (topLevelDefineCompiledEsmExpressions.length > 0 || code.indexOf('__esModule') >= 0);

  if (
    !(
      requiredSources.length ||
      dynamicRegisterSources.size ||
      uses.module ||
      uses.exports ||
      uses.require ||
      usesDynamicRequire ||
      hasRemovedRequire ||
      topLevelDefineCompiledEsmExpressions.length > 0
    ) &&
    (ignoreGlobal || !uses.global)
  ) {
    return { meta: { commonjs: { isCommonJS: false } } };
  }

  let leadingComment = '';
  if (code.startsWith('/*')) {
    const commentEnd = code.indexOf('*/', 2) + 2;
    leadingComment = `${code.slice(0, commentEnd)}\n`;
    magicString.remove(0, commentEnd).trim();
  }

  const exportMode = shouldWrap
    ? uses.module
      ? 'module'
      : 'exports'
    : firstTopLevelModuleExportsAssignment
    ? exportsAssignmentsByName.size === 0 && topLevelDefineCompiledEsmExpressions.length === 0
      ? 'replace'
      : 'module'
    : moduleExportsAssignments.length === 0
    ? 'exports'
    : 'module';

  const importBlock = rewriteRequireExpressionsAndGetImportBlock(
    magicString,
    topLevelDeclarations,
    topLevelRequireDeclarators,
    reassignedNames,
    HELPERS_NAME,
    dynamicRegisterSources,
    moduleName,
    exportsName,
    id,
    exportMode
  );

  const exportBlock = isEsModule
    ? ''
    : rewriteExportsAndGetExportsBlock(
        magicString,
        moduleName,
        exportsName,
        shouldWrap,
        moduleExportsAssignments,
        firstTopLevelModuleExportsAssignment,
        exportsAssignmentsByName,
        topLevelAssignments,
        topLevelDefineCompiledEsmExpressions,
        deconflictedExportNames,
        code,
        HELPERS_NAME,
        exportMode,
        detectWrappedDefault,
        defaultIsModuleExports
      );

  if (shouldWrap) {
    wrapCode(magicString, uses, moduleName, exportsName);
  }

  magicString
    .trim()
    .prepend(leadingComment + importBlock)
    .append(exportBlock);

  return {
    code: magicString.toString(),
    map: sourceMap ? magicString.generateMap() : null,
    syntheticNamedExports: isEsModule ? false : '__moduleExports',
    meta: { commonjs: { isCommonJS: !isEsModule } }
  };
}
