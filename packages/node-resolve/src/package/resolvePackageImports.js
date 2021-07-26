import { pathToFileURL } from 'url';

import { createBaseErrorMsg, findPackageJson, InvalidModuleSpecifierError } from './utils';
import resolvePackageImportsExports from './resolvePackageImportsExports';

async function resolvePackageImports({
  importSpecifier,
  importer,
  moduleDirs,
  conditions,
  resolveId
}) {
  const result = await findPackageJson(importer, moduleDirs);
  if (!result) {
    throw new Error(createBaseErrorMsg('. Could not find a parent package.json.'));
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

  const { imports } = pkgJson;
  if (!imports) {
    throw new InvalidModuleSpecifierError(context, true);
  }

  if (importSpecifier === '#' || importSpecifier.startsWith('#/')) {
    throw new InvalidModuleSpecifierError(context, true, 'Invalid import specifier.');
  }

  return resolvePackageImportsExports(context, {
    matchKey: importSpecifier,
    matchObj: imports,
    internal: true
  });
}

export default resolvePackageImports;
