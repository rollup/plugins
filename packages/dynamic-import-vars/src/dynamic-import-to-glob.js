import path from 'path';

export class VariableDynamicImportError extends Error {}

/* eslint-disable-next-line no-template-curly-in-string */
const example = 'For example: import(`./foo/${bar}.js`).';

function sanitizeString(str) {
  if (str.includes('*')) {
    throw new VariableDynamicImportError('A dynamic import cannot contain * characters.');
  }
  return str;
}

function templateLiteralToGlob(node) {
  let glob = '';

  for (let i = 0; i < node.quasis.length; i += 1) {
    glob += sanitizeString(node.quasis[i].value.raw);
    if (node.expressions[i]) {
      glob += expressionToGlob(node.expressions[i]);
    }
  }

  return glob;
}

function callExpressionToGlob(node) {
  const { callee } = node;
  if (
    callee.type === 'MemberExpression' &&
    callee.property.type === 'Identifier' &&
    callee.property.name === 'concat'
  ) {
    return `${expressionToGlob(callee.object)}${node.arguments.map(expressionToGlob).join('')}`;
  }
  return '*';
}

function binaryExpressionToGlob(node) {
  if (node.operator !== '+') {
    throw new VariableDynamicImportError(`${node.operator} operator is not supported.`);
  }

  return `${expressionToGlob(node.left)}${expressionToGlob(node.right)}`;
}

function expressionToGlob(node) {
  switch (node.type) {
    case 'TemplateLiteral':
      return templateLiteralToGlob(node);
    case 'CallExpression':
      return callExpressionToGlob(node);
    case 'BinaryExpression':
      return binaryExpressionToGlob(node);
    case 'Literal': {
      return sanitizeString(node.value);
    }
    default:
      return '*';
  }
}

const defaultProtocol = 'file:';
const ignoredProtocols = ['data:', 'http:', 'https:'];

function shouldIgnore(glob) {
  const containsAsterisk = glob.includes('*');

  const globURL = new URL(glob, defaultProtocol);

  const containsIgnoredProtocol = ignoredProtocols.some(
    (ignoredProtocol) => ignoredProtocol === globURL.protocol
  );

  return !containsAsterisk || containsIgnoredProtocol;
}

const npmPackageNameAndGlobRegex = /^((@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*)\/(.+)$/;

/**
 *
 * @param {unknown} node The AST node representing the dynamic import.
 * @param {string} sourceString The fraction of the source code containing the dynamic import.
 * @param {string} id The id of the module containing this dynamic import.
 * @param {unknown} r The rollup instance
 * @returns {Promise<null | { glob: string, bareImport?: string, resolvedBareImport?: string }>} The glob to match files and the bare part of it
 */
export async function dynamicImportToGlob(node, sourceString, id, r) {
  if (sourceString.includes('webpackIgnore: true')) {
    return null;
  }

  let glob = expressionToGlob(node);
  let bareImport;
  let resolvedBareImport;

  if (shouldIgnore(glob)) {
    return null;
  }

  glob = glob.replace(/\*\*/g, '*');

  if (glob.startsWith('*')) {
    throw new VariableDynamicImportError(
      `invalid import "${sourceString}". It cannot be statically analyzed. Variable dynamic imports must start with ./ and be limited to a specific directory. ${example}`
    );
  }

  if (glob.startsWith('/')) {
    throw new VariableDynamicImportError(
      `invalid import "${sourceString}". Variable absolute imports are not supported, imports must start with ./ in the static part of the import. ${example}`
    );
  }

  if (!glob.startsWith('./') && !glob.startsWith('../')) {
    const match = glob.match(npmPackageNameAndGlobRegex);

    if (match) {
      const [, packageName, , packageGlob] = match;
      const resolvedPackageJson = await r.resolve(`${packageName}/package.json`, id);

      if (!resolvedPackageJson) {
        throw new VariableDynamicImportError(
          `invalid import "${sourceString}". Could not resolve module "${packageName}".`
        );
      }

      glob = `${path.relative(
        path.dirname(id),
        path.dirname(resolvedPackageJson.id)
      )}/${packageGlob}`;
      bareImport = packageName;
      resolvedBareImport = path.dirname(resolvedPackageJson.id);
    } else {
      throw new VariableDynamicImportError(
        `invalid import "${sourceString}". Non-relative variable imports that do not match an NPM package name are not supported, imports must start with either an npm package name or ./ in the static part of the import. ${example}`
      );
    }
  }

  // Disallow ./*.ext
  const ownDirectoryStarExtension = /^\.\/\*\.[\w]+$/;
  if (ownDirectoryStarExtension.test(glob)) {
    throw new VariableDynamicImportError(
      `${
        `invalid import "${sourceString}". Variable imports cannot import their own directory, ` +
        'place imports in a separate directory or make the import filename more specific. '
      }${example}`
    );
  }

  if (path.extname(glob) === '') {
    throw new VariableDynamicImportError(
      `invalid import "${sourceString}". A file extension must be included in the static part of the import. ${example}`
    );
  }

  return { glob, bareImport, resolvedBareImport };
}
