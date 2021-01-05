export function wrapCode(magicString, uses, moduleName) {
  const args = `module${uses.exports ? ', exports' : ''}`;
  const passedArgs = `${moduleName}${uses.exports ? `, ${moduleName}.exports` : ''}`;

  magicString.trim().prepend(`(function (${args}) {\n`).append(`\n}(${passedArgs}));`);
}

export function rewriteExportsAndGetExportsBlock(
  magicString,
  moduleName,
  exportsName,
  wrapped,
  topLevelModuleExportsAssignments,
  topLevelExportsAssignmentsByName,
  defineCompiledEsmExpressions,
  deconflict,
  code,
  uses,
  HELPERS_NAME,
  id,
  replacesModuleExports
) {
  const exports = [];
  const exportDeclarations = [];

  // TODO Lukas maybe introduce an export mode with
  //  - 'replace'
  //  - 'wrapped'
  //  - 'module'
  //  - 'exports'
  // TODO Lukas consider extracting parts that "getExportDeclarations" for the specific cases
  if (replacesModuleExports) {
    if (topLevelModuleExportsAssignments.length > 0) {
      for (const { left } of topLevelModuleExportsAssignments) {
        magicString.overwrite(left.start, left.end, `var ${exportsName}`);
      }
    } else {
      exportDeclarations.unshift(`var ${exportsName} = {};`);
    }
    exports.push(`${exportsName} as __moduleExports`, `${exportsName} as default`);
  } else {
    exports.push(`${exportsName} as __moduleExports`);
    if (wrapped) {
      if (defineCompiledEsmExpressions.length > 0 || code.indexOf('__esModule') >= 0) {
        // eslint-disable-next-line no-param-reassign
        uses.commonjsHelpers = true;
        exportDeclarations.push(
          `export default /*@__PURE__*/${HELPERS_NAME}.getDefaultExportFromCjs(${moduleName}.exports);`
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
      for (const { left } of topLevelModuleExportsAssignments) {
        magicString.overwrite(left.start, left.end, `${moduleName}.exports`);
      }

      // Collect and rewrite named exports
      for (const [exportName, node] of topLevelExportsAssignmentsByName) {
        const deconflicted = deconflict(exportName);
        magicString.overwrite(node.start, node.left.end, `var ${deconflicted}`);

        if (exportName === 'default') {
          deconflictedDefaultExportName = deconflicted;
        } else {
          exports.push(
            exportName === deconflicted ? exportName : `${deconflicted} as ${exportName}`
          );
        }

        magicString.appendLeft(
          code[node.end] === ';' ? node.end + 1 : node.end,
          `\n${exportsName}.${exportName} = ${deconflicted};`
        );
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
        exports.push(`${deconflictedDefaultExportName || exportsName} as default`);
      } else if (deconflictedDefaultExportName && code.indexOf('__esModule') >= 0) {
        // eslint-disable-next-line no-param-reassign
        uses.commonjsHelpers = true;
        exportDeclarations.push(
          `export default /*@__PURE__*/${HELPERS_NAME}.getDefaultExportFromCjs(${moduleName}.exports);`
        );
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
