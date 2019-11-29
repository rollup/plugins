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
