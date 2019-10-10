const defaults = {
  errors: true,
  warnings: false
};
const beep = (opts) => {
  const options = Object.assign({}, defaults, opts);
  return {
    name: 'beep',
    buildEnd(err) {
      if (err && options.errors) {
        process.stderr.write('\x07');
      }
    }
  };
};

module.exports = beep;
