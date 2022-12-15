const path = require('path');
const process = require('process');

/**
 * @param {import('rollup').RollupBuild} bundle
 * @param {import('rollup').OutputOptions} [outputOptions]
 */
const getCode = async (bundle, outputOptions, allFiles = false) => {
  const { output } = await bundle.generate(outputOptions || { format: 'cjs', exports: 'auto' });

  if (allFiles) {
    return output.map(({ code, fileName, source, map }) => {
      return {
        code,
        fileName,
        source,
        map
      };
    });
  }
  const [{ code }] = output;
  return code;
};

/**
 * @param {import('rollup').RollupBuild} bundle
 * @param {import('rollup').OutputOptions} [outputOptions]
 */
const getFiles = async (bundle, outputOptions) => {
  if (!outputOptions.dir && !outputOptions.file)
    throw new Error('You must specify "output.file" or "output.dir" for the build.');

  const { output } = await bundle.generate(outputOptions || { format: 'cjs', exports: 'auto' });

  return output.map(({ code, fileName, source }) => {
    const absPath = path.resolve(outputOptions.dir || path.dirname(outputOptions.file), fileName);
    return {
      fileName: path.relative(process.cwd(), absPath).split(path.sep).join('/'),
      content: code || source
    };
  });
};

const getImports = async (bundle) => {
  if (bundle.imports) {
    return bundle.imports;
  }
  const { output } = await bundle.generate({ format: 'es' });
  const [{ imports }] = output;
  return imports;
};

const getResolvedModules = async (bundle) => {
  const {
    output: [{ modules }]
  } = await bundle.generate({ format: 'es' });
  return modules;
};

// eslint-disable-next-line no-console
const onwarn = (warning) => console.warn(warning.toString());

/**
 * @param {import('ava').Assertions} t
 * @param {import('rollup').RollupBuild} bundle
 * @param {object} args
 */
const testBundle = async (t, bundle, { inject = {}, options = {} } = {}) => {
  const { output } = await bundle.generate({ format: 'cjs', exports: 'auto', ...options });
  const [{ code }] = output;
  const module = { exports: {} };
  // as of 1/2/2020 Github Actions + Windows has changed in a way that we must now escape backslashes
  const cwd = process.cwd().replace(/\\/g, '\\\\');
  const params = ['module', 'exports', 'require', 't', ...Object.keys(inject)].concat(
    `process.chdir('${cwd}'); let result;\n\n${code}\n\nreturn result;`
  );

  // eslint-disable-next-line no-new-func
  const func = new Function(...params);
  let error;
  let result;

  try {
    result = func(...[module, module.exports, require, t, ...Object.values(inject)]);
  } catch (e) {
    error = e;
  }

  return { code, error, module, result };
};

const evaluateBundle = async (bundle) => {
  const { module } = await testBundle(null, bundle);
  return module.exports;
};

module.exports = {
  evaluateBundle,
  getCode,
  getFiles,
  getImports,
  getResolvedModules,
  onwarn,
  testBundle
};
