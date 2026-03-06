const { rollup } = require('rollup');

const esmShim = require('../');

test.sequential('inject cjs shim for esm output', async () => {
  const bundle = await rollup({
    input: 'test/fixtures/cjs.js',
    plugins: [esmShim()]
  });
  const result = await bundle.generate({
    format: 'es'
  });
  expect(result.output.length).toBe(1);
  const [output] = result.output;
  expect(output.code).toMatchSnapshot();
  expect(output.map).toBeFalsy();
});
test.sequential('inject cjs shim for esm output with sourcemap', async () => {
  const bundle = await rollup({
    input: 'test/fixtures/cjs.js',
    plugins: [esmShim()]
  });
  const result = await bundle.generate({
    format: 'es',
    sourcemap: true
  });
  expect(result.output.length).toBe(2);
  const [output, map] = result.output;
  expect(output.code).toMatchSnapshot();
  expect(output.map).toBeTruthy();
  expect(output.map.file).toBe('cjs.js');
  expect(output.map.sources).toEqual(['test/fixtures/cjs.js']);
  expect(map.fileName).toBe('cjs.js.map');
});
test.sequential('not inject cjs shim for cjs output', async () => {
  const bundle = await rollup({
    input: 'test/fixtures/cjs.js',
    plugins: [esmShim()]
  });
  const result = await bundle.generate({
    format: 'cjs'
  });
  expect(result.output.length).toBe(1);
  const [output] = result.output;
  expect(output.code).toMatchSnapshot();
  expect(output.map).toBeFalsy();
});
test.sequential('inject cjs shim for esm output with a single import statement', async () => {
  const bundle = await rollup({
    input: 'test/fixtures/cjs-single-import.js',
    plugins: [esmShim()],
    external: ['magic-string']
  });
  const result = await bundle.generate({
    format: 'es'
  });
  expect(result.output.length).toBe(1);
  const [output] = result.output;
  expect(output.code).toMatchSnapshot();
  expect(output.map).toBeFalsy();
});
test.sequential('inject cjs shim for esm output with multiple import statements', async () => {
  const bundle = await rollup({
    input: 'test/fixtures/cjs-multiple-imports.js',
    plugins: [esmShim()],
    external: ['magic-string', 'node:crypto']
  });
  const result = await bundle.generate({
    format: 'es'
  });
  expect(result.output.length).toBe(1);
  const [output] = result.output;
  expect(output.code).toMatchSnapshot();
  expect(output.map).toBeFalsy();
});

// see issue #1649 https://github.com/rollup/plugins/issues/1649
test.sequential(
  'inject cjs shim should not break on valid js object with `import` literal value',
  async () => {
    const bundle = await rollup({
      input: 'test/fixtures/cjs-import-literal.js',
      plugins: [esmShim()]
    });
    const result = await bundle.generate({
      format: 'es'
    });
    expect(result.output.length).toBe(1);
    const [output] = result.output;
    expect(output.code).toMatchSnapshot();
    expect(output.map).toBeFalsy();
  }
);
