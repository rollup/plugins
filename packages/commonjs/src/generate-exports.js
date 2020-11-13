export function wrapCode(magicString, uses, moduleName, HELPERS_NAME, virtualDynamicRequirePath) {
  const args = `module${uses.exports ? ', exports' : ''}`;

  magicString
    .trim()
    .prepend(`var ${moduleName} = ${HELPERS_NAME}.createCommonjsModule(function (${args}) {\n`)
    .append(
      `\n}${virtualDynamicRequirePath ? `, ${JSON.stringify(virtualDynamicRequirePath)}` : ''});`
    );
}

export function rewriteExportsAndAppendExportsBlock(
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
  HELPERS_NAME
) {
  const namedExportDeclarations = [`export { ${moduleName} as __moduleExports };`];
  const moduleExportsPropertyAssignments = [];
  let deconflictedDefaultExportName;

  if (!wrapped) {
    let hasModuleExportsAssignment = false;
    const namedExportProperties = [];

    // Collect and rewrite module.exports assignments
    for (const { left } of topLevelModuleExportsAssignments) {
      hasModuleExportsAssignment = true;
      magicString.overwrite(left.start, left.end, `var ${moduleName}`);
    }

    // Collect and rewrite named exports
    for (const [exportName, node] of topLevelExportsAssignmentsByName) {
      const deconflicted = deconflict(exportName);
      magicString.overwrite(node.start, node.left.end, `var ${deconflicted}`);

      if (exportName === 'default') {
        deconflictedDefaultExportName = deconflicted;
      } else {
        namedExportDeclarations.push(
          exportName === deconflicted
            ? `export { ${exportName} };`
            : `export { ${deconflicted} as ${exportName} };`
        );
      }

      if (hasModuleExportsAssignment) {
        moduleExportsPropertyAssignments.push(`${moduleName}.${exportName} = ${deconflicted};`);
      } else {
        namedExportProperties.push(`\t${exportName}: ${deconflicted}`);
      }
    }

    // Regenerate CommonJS namespace
    if (!hasModuleExportsAssignment) {
      const moduleExports = `{\n${namedExportProperties.join(',\n')}\n}`;
      magicString
        .trim()
        .append(
          `\n\nvar ${moduleName} = ${
            isRestorableCompiledEsm
              ? `/*#__PURE__*/Object.defineProperty(${moduleExports}, '__esModule', {value: true})`
              : moduleExports
          };`
        );
    }
  }

  // Generate default export
  const defaultExport = [];
  if (isRestorableCompiledEsm) {
    defaultExport.push(`export default ${deconflictedDefaultExportName || moduleName};`);
  } else if (
    (wrapped || deconflictedDefaultExportName) &&
    (defineCompiledEsmExpressions.length > 0 || code.indexOf('__esModule') >= 0)
  ) {
    // eslint-disable-next-line no-param-reassign
    uses.commonjsHelpers = true;
    defaultExport.push(
      `export default /*@__PURE__*/${HELPERS_NAME}.getDefaultExportFromCjs(${moduleName});`
    );
  } else {
    defaultExport.push(`export default ${moduleName};`);
  }

  magicString.trim().append(
    `\n\n${defaultExport
      .concat(namedExportDeclarations)
      .concat(moduleExportsPropertyAssignments)
      .join('\n')}`
  );
}
