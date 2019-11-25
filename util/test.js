const getCode = async (bundle) => {
  const { output } = await bundle.generate({ format: 'cjs' });
  const [{ code }] = output;

  return code;
};

const testBundle = async (t, bundle, args = {}) => {
  const { output } = await bundle.generate({ format: 'cjs' });
  const [{ code }] = output;
  const params = Object.keys(args).concat('t', `let result;\n\n${code}\n\nreturn result;`);
  // eslint-disable-next-line no-new-func
  const func = new Function(...params);

  return { code, result: func(...[t, ...Object.values(args)]) };
};

module.exports = {
  getCode,
  testBundle
};
