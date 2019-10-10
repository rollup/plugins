const test = require('ava');
const execa = require('execa');
const strip = require('strip-ansi');

const options = { cwd: __dirname };

test('pass', async (t) => {
  const args = '--config fixtures/pass.config.js'.split(' ');
  const { stderr } = await execa('rollup', args, options);

  t.snapshot(strip(stderr.replace(/\d+ms/, '<time>ms')));
});

test('error', async (t) => {
  const args = '--config fixtures/error.config.js'.split(' ');
  const throws = async () => execa('rollup', args, options);

  const { stderr } = await t.throwsAsync(throws);
  t.truthy(stderr.indexOf('\x07'));
});
