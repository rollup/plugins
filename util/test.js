/**
 * @param {import('rollup').RollupBuild} bundle
 * @param {import('rollup').OutputOptions} outputOptions
 */
const getCode = async (bundle, outputOptions, allFiles = false) => {
  const { output } = await bundle.generate(outputOptions || { format: 'cjs' });

  if (allFiles) {
    return output.map(({ code, fileName, source }) => {
      return { code, fileName, source };
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

/**
 * @param {import('ava').Assertions} t
 * @param {import('rollup').RollupBuild} bundle
 * @param {object} args
 */
const testBundle = async (t, bundle, args = {}) => {
  const { output } = await bundle.generate({ format: 'cjs' });
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

module.exports = {
  getCode,
  getImports,
  testBundle
};
