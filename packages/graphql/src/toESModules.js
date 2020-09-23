import { EOL } from 'os';

export default function(source) {
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
  source = source.replace(/require\(([^)]+)\)/gi, (match, path) => {
    path = path.replace(/["']+/g, '');

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

  return importsOutput + EOL + source;
}
