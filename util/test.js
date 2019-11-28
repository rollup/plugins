/**
 * Gets the code from a rollup bundle.
 * @param {import('rollup').RollupBuild} bundle
 */
const getCode = async (bundle) => {
  const { output } = await bundle.generate({ format: 'cjs' });
  const [{ code }] = output;

  return code;
};

/**
 * Runs a bundle for testing.
 * A `result` variable is also inject that lets the script return some result.
 * @param {import('ava').Assertions} t Ava assertions object.
 * `t` is injected into the script so that test assertions can be used.
 * @param {import('rollup').RollupBuild} bundle The rollup bundle to run.
 * @param {object} args Additional arguments for the script.
 * Each key is an argument name, and the value is the value passed to the function.
 */
const testBundle = async (t, bundle, args = {}) => {
  const { output } = await bundle.generate({ format: 'cjs' });
  const [{ code }] = output;
  const params = Object.keys(args).concat('t', `let result;\n\n${code}\n\nreturn result;`);
  // eslint-disable-next-line no-new-func
  const func = new Function(...params);

  return { code, result: func(...Object.values(args), t) };
};

module.exports = {
  getCode,
  testBundle
};
