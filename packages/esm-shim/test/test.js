const test = require('ava');
const { rollup } = require('rollup');

const esmShim = require('../');

test.serial('inject cjs shim for esm output', async (t) => {
  const bundle = await rollup({
    input: 'test/fixtures/cjs.js',
    plugins: [esmShim()]
  });
  const result = await bundle.generate({ format: 'es' });
  t.is(result.output.length, 1);
  const [output] = result.output;
  t.snapshot(output.code);
  t.falsy(output.map);
});

test.serial('inject cjs shim for esm output with sourcemap', async (t) => {
  const bundle = await rollup({
    input: 'test/fixtures/cjs.js',
    plugins: [esmShim()]
  });
  const result = await bundle.generate({ format: 'es', sourcemap: true });
  t.is(result.output.length, 2);
  const [output, map] = result.output;
  t.snapshot(output.code);
  t.truthy(output.map);
  t.is(output.map.file, 'cjs.js');
  t.deepEqual(output.map.sources, ['test/fixtures/cjs.js']);
  t.is(map.fileName, 'cjs.js.map');
});

test.serial('not inject cjs shim for cjs output', async (t) => {
  const bundle = await rollup({
    input: 'test/fixtures/cjs.js',
    plugins: [esmShim()]
  });
  const result = await bundle.generate({ format: 'cjs' });
  t.is(result.output.length, 1);
  const [output] = result.output;
  t.snapshot(output.code);
  t.falsy(output.map);
});

test.serial('inject cjs shim for esm output with a single import statement', async (t) => {
  const bundle = await rollup({
    input: 'test/fixtures/cjs-single-import.js',
    plugins: [esmShim()],
    external: ['magic-string']
  });
  const result = await bundle.generate({ format: 'es' });
  t.is(result.output.length, 1);
  const [output] = result.output;
  t.snapshot(output.code);
  t.falsy(output.map);
});

test.serial('inject cjs shim for esm output with multiple import statements', async (t) => {
  const bundle = await rollup({
    input: 'test/fixtures/cjs-multiple-imports.js',
    plugins: [esmShim()],
    external: ['magic-string', 'node:crypto']
  });
  const result = await bundle.generate({ format: 'es' });
  t.is(result.output.length, 1);
  const [output] = result.output;
  t.snapshot(output.code);
  t.falsy(output.map);
});
