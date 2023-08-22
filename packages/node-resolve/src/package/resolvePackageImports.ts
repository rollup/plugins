import { pathToFileURL } from 'url';

import { createBaseErrorMsg, findPackageJson, InvalidModuleSpecifierError } from './utils';
import resolvePackageImportsExports from './resolvePackageImportsExports';

interface ParamObject {
  importSpecifier: string;
  importer: string;
  moduleDirs: readonly string[];
  conditions: readonly string[];
  resolveId: (id: string) => any;
}

async function resolvePackageImports({
  importSpecifier,
  importer,
  moduleDirs,
  conditions,
  resolveId
}: ParamObject) {
  const result = await findPackageJson(importer, moduleDirs);
  if (!result) {
    throw new Error(
      `${createBaseErrorMsg(importSpecifier, importer)}. Could not find a parent package.json.`
    );
  }

  const { pkgPath, pkgJsonPath, pkgJson } = result;
  const pkgURL = pathToFileURL(`${pkgPath}/`);
  const context = {
    importer,
    importSpecifier,
    moduleDirs,
    pkgURL,
    pkgJsonPath,
    conditions,
    resolveId
  };

  // Assert: specifier begins with "#".
  if (!importSpecifier.startsWith('#')) {
    throw new InvalidModuleSpecifierError(context, true, 'Invalid import specifier.');
  }

  // If specifier is exactly equal to "#" or starts with "#/", then
  if (importSpecifier === '#' || importSpecifier.startsWith('#/')) {
    // Throw an Invalid Module Specifier error.
    throw new InvalidModuleSpecifierError(context, true, 'Invalid import specifier.');
  }

  const { imports } = pkgJson;
  if (!imports) {
    throw new InvalidModuleSpecifierError(context, true);
  }

  // Let packageURL be the result of LOOKUP_PACKAGE_SCOPE(parentURL).
  // If packageURL is not null, then
  return resolvePackageImportsExports(context, {
    matchKey: importSpecifier,
    matchObj: imports,
    isImports: true
  });
}

export default resolvePackageImports;
