const execa = require('execa');

const options = { cwd: __dirname };

test('pass', async () => {
  const args = '--config fixtures/pass.config.js'.split(' ');
  const { stderr } = await execa('rollup', args, options);
  const { default: strip } = await import('strip-ansi');

  expect(strip(stderr.replace(/\d+ms|[\d.]+s/, '<time>ms'))).toMatchSnapshot();
});

test('error', async () => {
  const args = '--config fixtures/error.config.js'.split(' ');
  const throws = async () => execa('rollup', args, options);

  const error = await throws().then(
    () => null,
    (caught) => caught
  );
  expect(error).not.toBeNull();
  const { stderr } = error;
  expect(stderr.indexOf('\x07')).toBeTruthy();
});
