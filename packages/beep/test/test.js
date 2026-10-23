const { dirname, resolve } = require('path');

const execa = require('execa');

// Resolve the CLI from the rollup module that is active in the current test mode
// ("rollup-earliest" in earliest mode) so that the subprocess matches the module under test.
const rollupCli = resolve(dirname(require.resolve('rollup')), 'bin/rollup');

const options = { cwd: __dirname };

test('pass', async () => {
  const args = '--config fixtures/pass.config.js'.split(' ');
  const { stderr } = await execa(rollupCli, args, options);
  const { default: strip } = await import('strip-ansi');

  expect(strip(stderr.replace(/\d+ms|[\d.]+s/, '<time>ms'))).toMatchSnapshot();
});

test('error', async () => {
  const args = '--config fixtures/error.config.js'.split(' ');
  const throws = async () => execa(rollupCli, args, options);

  const error = await throws().then(
    () => null,
    (caught) => caught
  );
  expect(error).not.toBeNull();
  const { stderr } = error;
  expect(stderr.indexOf('\x07')).toBeTruthy();
});
