/**
 * @param {import('rollup').RollupBuild} bundle
 * @param {import('rollup').OutputOptions} [outputOptions]
 */
const getCode = async (bundle, outputOptions, allFiles = false) => {
  const { output } = await bundle.generate(outputOptions || { format: 'cjs', exports: 'auto' });

  if (allFiles) {
    return output.map(({ code, fileName, source, map }) => {
      return { code, fileName, source, map };
    });
  }
  const [{ code }] = output;
  return code;
};

const getImports = async (bundle) => {
  if (bundle.imports) {
    return bundle.imports;
  }
  const { output } = await bundle.generate({ format: 'esm' });
  const [{ imports }] = output;
  return imports;
};

const getResolvedModules = async (bundle) => {
  const {
    output: [{ modules }]
  } = await bundle.generate({ format: 'esm' });
  return modules;
};

// eslint-disable-next-line no-console
const onwarn = (warning) => console.warn(warning.toString());

/**
 * @param {import('ava').Assertions} t
 * @param {import('rollup').RollupBuild} bundle
 * @param {object} args
 */
const testBundle = async (t, bundle, args = {}) => {
  const { output } = await bundle.generate({ format: 'cjs', exports: 'auto' });
  const [{ code }] = output;
  const module = { exports: {} };
  // as of 1/2/2020 Github Actions + Windows has changed in a way that we must now escape backslashes
  const cwd = process.cwd().replace(/\\/g, '\\\\');
  const params = ['module', 'exports', 'require', 't', ...Object.keys(args)].concat(
    `process.chdir('${cwd}'); let result;\n\n${code}\n\nreturn result;`
  );

  // eslint-disable-next-line no-new-func
  const func = new Function(...params);
  let error;
  let result;

  try {
    result = func(...[module, module.exports, require, t, ...Object.values(args)]);
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
  getImports,
  getResolvedModules,
  onwarn,
  testBundle
};
