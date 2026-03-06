const fs = require('fs');
const { EventEmitter } = require('events');

const { join } = require('path');

const childProcess = require('child_process');

const writeFile = require('util').promisify(fs.writeFile);

const del = require('del');
const { rollup } = require('rollup');
const sinon = require('sinon');

const run = require('../');

const cwd = join(__dirname, 'fixtures/');
const outputDir = join(cwd, 'output');
const file = join(outputDir, 'bundle.js');
const input = join(cwd, 'input.js');

process.chdir(cwd);

const outputOptions = { file, format: 'cjs' };
const outputDirOptions = { dir: outputDir, format: 'cjs' };

let mockChildProcess;
beforeAll(() => {
  mockChildProcess = sinon
    .stub(childProcess, ['fork'])
    .returns({ ...new EventEmitter(), kill: sinon.fake() });
});

test('builds the bundle and forks a child process', async () => {
  const bundle = await rollup({
    input,
    plugins: [run()]
  });
  await bundle.write(outputOptions);
  expect(mockChildProcess.calledWithExactly(outputOptions.file, [], {})).toBe(true);
});

test('takes input from the latest options', async () => {
  const bundle = await rollup({
    input: 'incorrect',
    plugins: [
      run(),
      {
        options(options) {
          // eslint-disable-next-line no-param-reassign
          options.input = input;
          return options;
        }
      }
    ]
  });
  await bundle.write(outputOptions);
  expect(mockChildProcess.calledWithExactly(outputOptions.file, [], {})).toBe(true);
});

test('checks entry point facade module', async () => {
  const bundle = await rollup({
    input: join(cwd, 'facade-entry/index.js'),
    preserveEntrySignatures: 'strict',
    plugins: [run()]
  });
  await bundle.write(outputDirOptions);
  expect(mockChildProcess.calledWithExactly(join(outputDir, 'index.js'), [], {})).toBe(true);
});

test('allows pass-through options for child_process.fork', async () => {
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
  expect(mockChildProcess.calledWithExactly(outputOptions.file, [], forkOptions)).toBe(true);
});

test('throws an error when bundle is not written to disk', async () => {
  const bundle = await rollup({
    input,
    plugins: [run()]
  });

  const error = await bundle.generate(outputOptions).catch((caught) => caught);

  expect(error).toBeInstanceOf(Error);
  expect(error.message).toBe(
    '@rollup/plugin-run currently only works with bundles that are written to disk'
  );
});

test('throws an error when input option is invalid', async () => {
  const testInput = join(cwd, 'change-detect-input.js');
  const bundle = await rollup({
    input: [input, testInput],
    plugins: [run({ input: 'something that is not an input' })]
  });

  const error = await bundle.write(outputDirOptions).catch((caught) => caught);

  expect(error).toBeInstanceOf(Error);
  expect(error.message).toBe('@rollup/plugin-run could not find output chunk');
});

test('throws an error when there are multiple entry points', async () => {
  const testInput = join(cwd, 'change-detect-input.js');

  const error = await rollup({
    input: [input, testInput],
    plugins: [run()]
  }).catch((caught) => caught);

  expect(error).toBeInstanceOf(Error);
  expect(error.message).toBe(
    '@rollup/plugin-run must have a single entry point; consider setting the `input` option'
  );
});

test('detects changes - forks a new child process and kills older process', async () => {
  // eslint-disable-next-line no-shadow
  const testInput = join(cwd, 'change-detect-input.js');
  const bundle = await rollup({
    input: testInput,
    plugins: [run()]
  });
  await bundle.write(outputOptions);
  await writeFile(testInput, "export const Greeting = () => 'Hola';  // eslint-disable-line");
  await bundle.write(outputOptions);
  expect(mockChildProcess.calledWithExactly(outputOptions.file, [], {})).toBe(true);
  expect(mockChildProcess().kill.callCount).toBe(1);
});

test('allow the allowRestart option', async () => {
  const bundle = await rollup({
    input,
    plugins: [run({ allowRestarts: true })]
  });
  await bundle.write(outputOptions);
  expect(mockChildProcess.calledWithExactly(outputOptions.file, [], {})).toBe(true);
});

test('allow the input option', async () => {
  const testInput = join(cwd, 'change-detect-input.js');
  const bundle = await rollup({
    input: [input, testInput],
    plugins: [run({ input })]
  });
  await bundle.write(outputDirOptions);
  expect(mockChildProcess.calledWithExactly(join(outputDir, 'input.js'), [], { input })).toBe(true);
});

afterAll(async () => {
  await del(['output']);
});
