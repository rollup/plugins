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
  topLevelExportsAssignmentsByName,
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
      // TODO Lukas wrap if (exportMode: wrapped)
      //  - There is an assignment to module or exports
      //  - There is an assignment to module.exports but exports is used separately (module.exports.foo is ok if we create the corresponding variable at the top)
      // TODO Lukas replace if (exportMode: replaced)
      //  - There are top-level module.exports assignments
      // TODO Lukas use only exports if (exportMode: exports)
      //  - There are no assignments to module.exports (except module.exports.foo)
      //  - module is not used as a variable
      // TODO Lukas use module otherwise (exportMode: module)

      // Collect and rewrite module.exports assignments
      for (const { left } of moduleExportsAssignments) {
        magicString.overwrite(left.start, left.end, `${moduleName}.exports`);
      }

      // Collect and rewrite named exports
      for (const [exportName, nodes] of topLevelExportsAssignmentsByName) {
        // TODO Lukas if we allow nested assignments, we would need to deconflict all of them
        const deconflicted = deconflictedExportNames[exportName];
        for (const node of nodes) {
          magicString.overwrite(
            node.start,
            node.left.end,
            `var ${deconflicted} = ${exportsName}.${exportName}`
          );
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
