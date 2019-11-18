const vm = require('vm');

const os = require('os');
const constants = require('constants');

const globals = require('rollup-plugin-node-globals');
const rollup = require('rollup');

const debug = require('debug')('builtins:test');

const builtins = require('..');

const files = [
  'events.js',
  'url-parse.js',
  'url-format.js',
  'stream.js',
  'assert.js',
  'constants.js',
  'os.js',
  'path.js',
  'string-decoder.js',
  'zlib.js',
  'domain.js',
  'crypto.js'
];
describe('rollup-plugin-node-builtins', () => {
  files.forEach((file) => {
    it(`works with ${file}`, (done) => {
      const config = {
        entry: `test/examples/${file}`,
        plugins: [builtins()]
      };
      if (
        file === 'url-parse.js' ||
        file === 'domain.js' ||
        file === 'url-format.js' ||
        file === 'stream.js' ||
        file === 'assert.js' ||
        file === 'string-decoder.js' ||
        file === 'zlib.js'
      ) {
        config.plugins.push(globals());
      }
      rollup
        .rollup(config)
        .then((bundle) => {
          const generated = bundle.generate();
          const { code } = generated;
          debug(code);
          const script = new vm.Script(code);
          const context = vm.createContext({
            done,
            setTimeout,
            clearTimeout,
            console,
            _constants: constants,
            _osEndianness: os.endianness()
          });
          context.self = context;
          script.runInContext(context);
        })
        .catch(done);
    });
  });
  it('crypto option works (though is broken)', (done) => {
    const config = {
      entry: 'test/examples/crypto.js',
      plugins: [
        builtins({
          crypto: true
        })
      ]
    };
    rollup.rollup(config).then(
      () => {
        done(new Error('should not get here'));
      },
      (err) => {
        debug(err);
        done();
      }
    );
  });
});
