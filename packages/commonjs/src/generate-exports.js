export function wrapCode(magicString, uses, moduleName, exportsName) {
  const args = [];
  const passedArgs = [];
  if (uses.module) {
    args.push('module');
    passedArgs.push(moduleName);
  }
  if (uses.exports) {
    args.push('exports');
    passedArgs.push(exportsName);
  }
  magicString
    .trim()
    .prepend(`(function (${args.join(', ')}) {\n`)
    .append(`\n}(${passedArgs.join(', ')}));`);
}

export function rewriteExportsAndGetExportsBlock(
  magicString,
  moduleName,
  exportsName,
  wrapped,
  moduleExportsAssignments,
  firstTopLevelModuleExportsAssignment,
  exportsAssignmentsByName,
  topLevelAssignments,
  defineCompiledEsmExpressions,
  deconflictedExportNames,
  code,
  HELPERS_NAME,
  exportMode,
  detectWrappedDefault
) {
  const exports = [];
  const exportDeclarations = [];

  // TODO Lukas consider extracting parts that "getExportDeclarations" for the specific cases
  if (exportMode === 'replace') {
    for (const { left } of moduleExportsAssignments) {
      magicString.overwrite(left.start, left.end, exportsName);
    }
    magicString.prependRight(firstTopLevelModuleExportsAssignment.left.start, 'var ');
    exports.push(`${exportsName} as __moduleExports`, `${exportsName} as default`);
  } else {
    exports.push(`${exportsName} as __moduleExports`);
    if (wrapped) {
      if (detectWrappedDefault) {
        exportDeclarations.push(
          `export default /*@__PURE__*/${HELPERS_NAME}.getDefaultExportFromCjs(${exportsName});`
        );
      } else {
        exports.push(`${exportsName} as default`);
      }
    } else {
      let deconflictedDefaultExportName;
      // Collect and rewrite module.exports assignments
      for (const { left } of moduleExportsAssignments) {
        magicString.overwrite(left.start, left.end, `${moduleName}.exports`);
      }

      // Collect and rewrite named exports
      for (const [exportName, { nodes }] of exportsAssignmentsByName) {
        const deconflicted = deconflictedExportNames[exportName];
        let needsDeclaration = true;
        for (const node of nodes) {
          let replacement = `${deconflicted} = ${exportsName}.${exportName}`;
          if (needsDeclaration && topLevelAssignments.has(node)) {
            replacement = `var ${replacement}`;
            needsDeclaration = false;
          }
          magicString.overwrite(node.start, node.left.end, replacement);
        }
        if (needsDeclaration) {
          magicString.prepend(`var ${deconflicted};\n`);
        }

        if (exportName === 'default') {
          deconflictedDefaultExportName = deconflicted;
        } else {
          exports.push(
            exportName === deconflicted ? exportName : `${deconflicted} as ${exportName}`
          );
        }
      }

      // Collect and rewrite exports.__esModule assignments
      let isRestorableCompiledEsm = false;
      for (const expression of defineCompiledEsmExpressions) {
        isRestorableCompiledEsm = true;
        const moduleExportsExpression =
          expression.type === 'CallExpression' ? expression.arguments[0] : expression.left.object;
        magicString.overwrite(
          moduleExportsExpression.start,
          moduleExportsExpression.end,
          exportsName
        );
      }

      if (isRestorableCompiledEsm) {
        if (moduleExportsAssignments.length === 0) {
          exports.push(`${deconflictedDefaultExportName || exportsName} as default`);
        } else {
          exportDeclarations.push(
            `export default /*@__PURE__*/${HELPERS_NAME}.getDefaultExportFromCjs(${exportsName});`
          );
        }
      } else {
        exports.push(`${exportsName} as default`);
      }
    }
  }
  if (exports.length) {
    exportDeclarations.push(`export { ${exports.join(', ')} };`);
  }

  return `\n\n${exportDeclarations.join('\n')}`;
}
