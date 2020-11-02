/* eslint-disable no-underscore-dangle */

import { getAssignedMember, isDefineCompiledEsm, isTruthy, KEY_COMPILED_ESM } from './ast-utils';
import { tryParse } from './parse';

export default function analyzeTopLevelStatements(parse, code, id) {
  const ast = tryParse(parse, code, id);

  let isEsModule = false;
  let __esModuleTrue = false;
  let hasDefaultExport = false;
  let hasNamedExports = false;
  let reassignedExports = false;

  for (const node of ast.body) {
    switch (node.type) {
      case 'ExportDefaultDeclaration':
        isEsModule = true;
        hasDefaultExport = true;
        break;
      case 'ExportNamedDeclaration':
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
        break;
      case 'ExportAllDeclaration':
        isEsModule = true;
        if (node.exported && node.exported.name === 'default') {
          hasDefaultExport = true;
        } else {
          hasNamedExports = true;
        }
        break;
      case 'ImportDeclaration':
        isEsModule = true;
        break;
      case 'ExpressionStatement':
        if (node.expression) {
          if (node.expression.type === 'CallExpression') {
            // detect Object.defineProperty(exports, '__esModule', { value: true });
            if (isDefineCompiledEsm(node.expression)) {
              __esModuleTrue = true;
            }
          }

          if (node.expression.type === 'AssignmentExpression') {
            // detect exports.__esModule = true;
            const assignedMember = getAssignedMember(node);

            if (assignedMember) {
              const { object, key, value } = assignedMember;
              if (key === KEY_COMPILED_ESM) {
                if (isTruthy(value)) {
                  __esModuleTrue = true;
                }
              }

              // TODO Lukas this is only analyzing the top level and would fail at a nested assignment to module.exports
              // TODO Lukas add test for this
              // Do we really need the "compiled" information available?
              if (object === 'module' && key === 'exports') {
                reassignedExports = true;
              }
            }
          }
        }
        break;
      default:
    }
  }

  // don't treat mixed es modules as compiled es mdoules
  if (isEsModule) {
    __esModuleTrue = false;
  }

  const isCompiledEsModule = !reassignedExports && __esModuleTrue;
  return { isEsModule, isCompiledEsModule, hasDefaultExport, hasNamedExports, ast };
}
