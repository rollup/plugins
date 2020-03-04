const fs = require('fs');
const { EventEmitter } = require('events');

const { join } = require('path');

const childProcess = require('child_process');

const writeFile = require('util').promisify(fs.writeFile);

const del = require('del');
const { rollup } = require('rollup');
const test = require('ava');
const sinon = require('sinon');

const run = require('../lib/');

const cwd = join(__dirname, 'fixtures/');
const file = join(cwd, 'output/bundle.js');
const input = join(cwd, 'input.js');

process.chdir(cwd);

const outputOptions = { file, format: 'cjs' };

let mockChildProcess;
test.before(() => {
  mockChildProcess = sinon
    .stub(childProcess, ['fork'])
    .returns({ ...new EventEmitter(), kill: sinon.fake() });
});

test('builds the bundle and forks a child process', async (t) => {
  const bundle = await rollup({
    input,
    plugins: [run()]
  });
  await bundle.write(outputOptions);
  t.true(mockChildProcess.calledWithExactly(outputOptions.file, [], {}));
});

test('allows pass-through options for child_process.fork', async (t) => {
  const forkOptions = {
    cwd,
    detached: false,
    silent: false
  };
  const bundle = await rollup({
    input,
    plugins: [run(forkOptions)]
  });

  await bundle.write(outputOptions);
  t.true(mockChildProcess.calledWithExactly(outputOptions.file, [], forkOptions));
});

test('throws an error when bundle is not written to disk', async (t) => {
  const bundle = await rollup({
    input,
    plugins: [run()]
  });
  await t.throwsAsync(
    async () => {
      await bundle.generate(outputOptions);
    },
    {
      instanceOf: Error,
      message: '@rollup/plugin-run currently only works with bundles that are written to disk'
    }
  );
});

test('detects changes - forks a new child process and kills older process', async (t) => {
  // eslint-disable-next-line no-shadow
  const input = join(cwd, 'change-detect-input.js');
  const bundle = await rollup({
    input,
    plugins: [run()]
  });
  await bundle.write(outputOptions);
  await writeFile(input, "export const Greeting = () => 'Hola';  // eslint-disable-line");
  await bundle.write(outputOptions);
  t.true(mockChildProcess.calledWithExactly(outputOptions.file, [], {}));
  t.is(mockChildProcess().kill.callCount, 1);
});

test.only('works when chunk is use in entry and dynamic import', async (t) => {
  const bundle = await rollup({
    input: join(cwd, 'input-with-dynamic.js'),
    plugins: [run()]
  });
  await t.notThrowsAsync(async () => {
    await bundle.write({ dir: join(cwd, 'output'), format: 'cjs' });
  });
});

test.after(async () => {
  await del(['output']);
});
