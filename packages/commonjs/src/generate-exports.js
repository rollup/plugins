import { MODULE_SUFFIX, wrapId } from './helpers';

export function wrapCode(magicString, uses, moduleName) {
  const args = `module${uses.exports ? ', exports' : ''}`;
  const passedArgs = `${moduleName}${uses.exports ? `, ${moduleName}.exports` : ''}`;

  magicString
    .trim()
    .prepend(`(function (${args}) {\n`)
    .append(`\n}(${passedArgs}));`);
}

export function rewriteExportsAndGetExportsBlock(
  magicString,
  moduleName,
  wrapped,
  topLevelModuleExportsAssignments,
  topLevelExportsAssignmentsByName,
  defineCompiledEsmExpressions,
  deconflict,
  isRestorableCompiledEsm,
  code,
  uses,
  HELPERS_NAME,
  id
) {
  const exportDeclarations = [
    `export { exports as __moduleExports } from ${JSON.stringify(wrapId(id, MODULE_SUFFIX))}`
  ];
  const moduleExportsPropertyAssignments = [];

  if (wrapped) {
    if (defineCompiledEsmExpressions.length > 0 || code.indexOf('__esModule') >= 0) {
      // eslint-disable-next-line no-param-reassign
      uses.commonjsHelpers = true;
      exportDeclarations.push(
        `export default /*@__PURE__*/${HELPERS_NAME}.getDefaultExportFromCjs(${moduleName}.exports);`
      );
    } else {
      exportDeclarations.push(`export default ${moduleName}.exports;`);
    }
  } else {
    let deconflictedDefaultExportName;

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
        exportDeclarations.push(
          exportName === deconflicted
            ? `export { ${exportName} };`
            : `export { ${deconflicted} as ${exportName} };`
        );
      }

      magicString.appendLeft(
        code[node.end] === ';' ? node.end + 1 : node.end,
        `\n${moduleName}.exports.${exportName} = ${deconflicted};`
      );
    }

    if (isRestorableCompiledEsm) {
      exportDeclarations.push(
        deconflictedDefaultExportName
          ? `export {${deconflictedDefaultExportName} as default};`
          : `export default ${moduleName}.exports;`
      );
    } else if (deconflictedDefaultExportName && code.indexOf('__esModule') >= 0) {
      // eslint-disable-next-line no-param-reassign
      uses.commonjsHelpers = true;
      exportDeclarations.push(
        `export default /*@__PURE__*/${HELPERS_NAME}.getDefaultExportFromCjs(${moduleName}.exports);`
      );
    } else {
      exportDeclarations.push(`export default ${moduleName}.exports;`);
    }
  }

  return `\n\n${exportDeclarations.concat(moduleExportsPropertyAssignments).join('\n')}`;
}
