/* eslint-disable no-await-in-loop */
import path from 'path';
import fs from 'fs';
import { pathToFileURL } from 'url';
import { promisify } from 'util';

import { createBaseErrorMsg, InvalidModuleSpecifierError } from './utils';
import resolvePackageImportsExports from './resolvePackageImportsExports';

const fileExists = promisify(fs.exists);

function isModuleDir(current, moduleDirs) {
  return moduleDirs.some((dir) => current.endsWith(dir));
}

async function findPackageJson(base, moduleDirs) {
  const { root } = path.parse(base);
  let current = base;

  while (current !== root && !isModuleDir(current, moduleDirs)) {
    const pkgJsonPath = path.join(current, 'package.json');
    if (await fileExists(pkgJsonPath)) {
      const pkgJsonString = fs.readFileSync(pkgJsonPath, 'utf-8');
      return { pkgJson: JSON.parse(pkgJsonString), pkgPath: current, pkgJsonPath };
    }
    current = path.resolve(current, '..');
  }
  return null;
}

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
    throw new InvalidModuleSpecifierError(context, 'Invalid import specifier.');
  }

  return resolvePackageImportsExports(context, {
    matchKey: importSpecifier,
    matchObj: imports,
    internal: true
  });
}

export default resolvePackageImports;
