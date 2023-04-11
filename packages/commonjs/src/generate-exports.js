export function wrapCode(magicString, uses, moduleName, exportsName, indentExclusionRanges) {
  const args = [];
  const passedArgs = [];
  if (uses.module) {
    args.push('module');
    passedArgs.push(moduleName);
  }
  if (uses.exports) {
    args.push('exports');
    passedArgs.push(uses.module ? `${moduleName}.exports` : exportsName);
  }
  magicString
    .trim()
    .indent('\t', { exclude: indentExclusionRanges })
    .prepend(`(function (${args.join(', ')}) {\n`)
    // For some reason, this line is only indented correctly when using a
    // require-wrapper if we have this leading space
    .append(` \n} (${passedArgs.join(', ')}));`);
}

export function rewriteExportsAndGetExportsBlock(
  magicString,
  moduleName,
  exportsName,
  exportedExportsName,
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
  defaultIsModuleExports,
  usesRequireWrapper,
  requireName
) {
  const exports = [];
  const exportDeclarations = [];

  if (usesRequireWrapper) {
    getExportsWhenUsingRequireWrapper(
      magicString,
      wrapped,
      exportMode,
      exports,
      moduleExportsAssignments,
      exportsAssignmentsByName,
      moduleName,
      exportsName,
      requireName,
      defineCompiledEsmExpressions
    );
  } else if (exportMode === 'replace') {
    getExportsForReplacedModuleExports(
      magicString,
      exports,
      exportDeclarations,
      moduleExportsAssignments,
      firstTopLevelModuleExportsAssignment,
      exportsName,
      defaultIsModuleExports,
      HELPERS_NAME
    );
  } else {
    if (exportMode === 'module') {
      exportDeclarations.push(`var ${exportedExportsName} = ${moduleName}.exports`);
      exports.push(`${exportedExportsName} as __moduleExports`);
    } else {
      exports.push(`${exportsName} as __moduleExports`);
    }
    if (wrapped) {
      exportDeclarations.push(
        getDefaultExportDeclaration(exportedExportsName, defaultIsModuleExports, HELPERS_NAME)
      );
    } else {
      getExports(
        magicString,
        exports,
        exportDeclarations,
        moduleExportsAssignments,
        exportsAssignmentsByName,
        deconflictedExportNames,
        topLevelAssignments,
        moduleName,
        exportsName,
        exportedExportsName,
        defineCompiledEsmExpressions,
        HELPERS_NAME,
        defaultIsModuleExports,
        exportMode
      );
    }
  }
  if (exports.length) {
    exportDeclarations.push(`export { ${exports.join(', ')} }`);
  }

  return `\n\n${exportDeclarations.join(';\n')};`;
}

function getExportsWhenUsingRequireWrapper(
  magicString,
  wrapped,
  exportMode,
  exports,
  moduleExportsAssignments,
  exportsAssignmentsByName,
  moduleName,
  exportsName,
  requireName,
  defineCompiledEsmExpressions
) {
  exports.push(`${requireName} as __require`);
  if (wrapped) return;
  if (exportMode === 'replace') {
    rewriteModuleExportsAssignments(magicString, moduleExportsAssignments, exportsName);
  } else {
    rewriteModuleExportsAssignments(magicString, moduleExportsAssignments, `${moduleName}.exports`);
    // Collect and rewrite named exports
    for (const [exportName, { nodes }] of exportsAssignmentsByName) {
      for (const { node, type } of nodes) {
        magicString.overwrite(
          node.start,
          node.left.end,
          `${
            exportMode === 'module' && type === 'module' ? `${moduleName}.exports` : exportsName
          }.${exportName}`
        );
      }
    }
    replaceDefineCompiledEsmExpressionsAndGetIfRestorable(
      defineCompiledEsmExpressions,
      magicString,
      exportMode,
      moduleName,
      exportsName
    );
  }
}

function getExportsForReplacedModuleExports(
  magicString,
  exports,
  exportDeclarations,
  moduleExportsAssignments,
  firstTopLevelModuleExportsAssignment,
  exportsName,
  defaultIsModuleExports,
  HELPERS_NAME
) {
  for (const { left } of moduleExportsAssignments) {
    magicString.overwrite(left.start, left.end, exportsName);
  }
  magicString.prependRight(firstTopLevelModuleExportsAssignment.left.start, 'var ');
  exports.push(`${exportsName} as __moduleExports`);
  exportDeclarations.push(
    getDefaultExportDeclaration(exportsName, defaultIsModuleExports, HELPERS_NAME)
  );
}

function getDefaultExportDeclaration(exportedExportsName, defaultIsModuleExports, HELPERS_NAME) {
  return `export default ${
    defaultIsModuleExports === true
      ? exportedExportsName
      : defaultIsModuleExports === false
      ? `${exportedExportsName}.default`
      : `/*@__PURE__*/${HELPERS_NAME}.getDefaultExportFromCjs(${exportedExportsName})`
  }`;
}

function getExports(
  magicString,
  exports,
  exportDeclarations,
  moduleExportsAssignments,
  exportsAssignmentsByName,
  deconflictedExportNames,
  topLevelAssignments,
  moduleName,
  exportsName,
  exportedExportsName,
  defineCompiledEsmExpressions,
  HELPERS_NAME,
  defaultIsModuleExports,
  exportMode
) {
  let deconflictedDefaultExportName;
  // Collect and rewrite module.exports assignments
  for (const { left } of moduleExportsAssignments) {
    magicString.overwrite(left.start, left.end, `${moduleName}.exports`);
  }

  // Collect and rewrite named exports
  for (const [exportName, { nodes }] of exportsAssignmentsByName) {
    const deconflicted = deconflictedExportNames[exportName];
    let needsDeclaration = true;
    for (const { node, type } of nodes) {
      let replacement = `${deconflicted} = ${
        exportMode === 'module' && type === 'module' ? `${moduleName}.exports` : exportsName
      }.${exportName}`;
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
      exports.push(exportName === deconflicted ? exportName : `${deconflicted} as ${exportName}`);
    }
  }

  const isRestorableCompiledEsm = replaceDefineCompiledEsmExpressionsAndGetIfRestorable(
    defineCompiledEsmExpressions,
    magicString,
    exportMode,
    moduleName,
    exportsName
  );

  if (
    defaultIsModuleExports === false ||
    (defaultIsModuleExports === 'auto' &&
      isRestorableCompiledEsm &&
      moduleExportsAssignments.length === 0)
  ) {
    // If there is no deconflictedDefaultExportName, then we use the namespace as
    // fallback because there can be no "default" property on the namespace
    exports.push(`${deconflictedDefaultExportName || exportedExportsName} as default`);
  } else if (
    defaultIsModuleExports === true ||
    (!isRestorableCompiledEsm && moduleExportsAssignments.length === 0)
  ) {
    exports.push(`${exportedExportsName} as default`);
  } else {
    exportDeclarations.push(
      getDefaultExportDeclaration(exportedExportsName, defaultIsModuleExports, HELPERS_NAME)
    );
  }
}

function rewriteModuleExportsAssignments(magicString, moduleExportsAssignments, exportsName) {
  for (const { left } of moduleExportsAssignments) {
    magicString.overwrite(left.start, left.end, exportsName);
  }
}

function replaceDefineCompiledEsmExpressionsAndGetIfRestorable(
  defineCompiledEsmExpressions,
  magicString,
  exportMode,
  moduleName,
  exportsName
) {
  let isRestorableCompiledEsm = false;
  for (const { node, type } of defineCompiledEsmExpressions) {
    isRestorableCompiledEsm = true;
    const moduleExportsExpression =
      node.type === 'CallExpression' ? node.arguments[0] : node.left.object;
    magicString.overwrite(
      moduleExportsExpression.start,
      moduleExportsExpression.end,
      exportMode === 'module' && type === 'module' ? `${moduleName}.exports` : exportsName
    );
  }
  return isRestorableCompiledEsm;
}
