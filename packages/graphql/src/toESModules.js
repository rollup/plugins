/* eslint-disable import/prefer-default-export */

import { EOL } from 'os';

/**
 * Convert CommonJS exports to ES modules exports
 * @param source Source code to convert
 * @returns The converted source code
 */
export function toESModules(source) {
  if (typeof source !== 'string') {
    return source;
  }

  return replaceRequires(replaceModuleExports(source));
}

function replaceModuleExports(source) {
  return source
    .replace('module.exports = doc', 'export default doc')
    .replace(
      /module\.exports\["(.*)"] = oneQuery\(doc, "(.*)"\)/g,
      (match, g1, g2) => `export const ${g1} = oneQuery(doc, "${g2}")`
    );
}

function replaceRequires(source) {
  const imports = {};
  let index = 0;

  // replace a require statement with a variable
  const replaceSource = source.replace(/require\(["']([^"']+)["']\)/gi, (match, path) => {
    if (!imports[path]) {
      index += 1;
      imports[path] = `frgmt${index}`;
    }

    return imports[path];
  });

  // prepare import statements
  const importsOutput = Object.keys(imports)
    .map((path) => `import ${imports[path]} from "${path}";`)
    .join(EOL);

  return importsOutput + EOL + replaceSource;
}
