const path = require('path');
const childProcess = require('child_process');

module.exports = (opts = {}) => {
  let input;
  let proc;

  const args = opts.args || [];
  const forkOptions = opts.options || opts;
  delete forkOptions.args;

  return {
    name: 'run',

    // eslint-disable-next-line no-shadow
    options(opts) {
      let inputs = opts.input;

      if (typeof inputs === 'string') {
        inputs = [inputs];
      }

      if (typeof inputs === 'object') {
        inputs = Object.values(inputs);
      }

      if (inputs.length > 1) {
        throw new Error(`rollup-plugin-run only works with a single entry point`);
      }

      input = path.resolve(inputs[0]);
    },

    generateBundle(outputOptions, bundle, isWrite) {
      if (!isWrite) {
        this.error(`rollup-plugin-run currently only works with bundles that are written to disk`);
      }

      const dir = outputOptions.dir || path.dirname(outputOptions.file);

      let dest;

      for (const fileName in bundle) {
        if (Object.prototype.hasOwnProperty.call(bundle, fileName)) {
          const chunk = bundle[fileName];

          if (!('isEntry' in chunk)) {
            this.error(`rollup-plugin-run requires Rollup 0.65 or higher`);
          }

          // eslint-disable-next-line no-continue
          if (!chunk.isEntry) continue;

          if (chunk.modules[input]) {
            dest = path.join(dir, fileName);
            break;
          }
        }
      }

      if (dest) {
        if (proc) proc.kill();
        proc = childProcess.fork(dest, args, forkOptions);
      } else {
        this.error(`rollup-plugin-run could not find output chunk`);
      }
    }
  };
};
