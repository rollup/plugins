const { rollup } = require('rollup');

const swc = require('../');

test('cjs output for default export', async () => {
  const bundle = await rollup({
    input: 'test/fixtures/export-default.js',
    plugins: [swc()]
  });
  const result = await bundle.generate({ format: 'cjs' });
  expect(result.output.length).toBe(1);
  const [output] = result.output;
  expect(output.code).toBe(
    "'use strict';\n\nvar exportDefault = 5;\n\nmodule.exports = exportDefault;\n"
  );
});

test('esm output for default export', async () => {
  const bundle = await rollup({
    input: 'test/fixtures/export-default.js',
    plugins: [swc()]
  });
  const result = await bundle.generate({ format: 'esm' });
  expect(result.output.length).toBe(1);
  const [output] = result.output;
  expect(output.code).toBe('var exportDefault = 5;\n\nexport { exportDefault as default };\n');
});

test('cjs output for export', async () => {
  const bundle = await rollup({
    input: 'test/fixtures/export.js',
    plugins: [swc()]
  });
  const result = await bundle.generate({ format: 'cjs' });
  expect(result.output.length).toBe(1);
  const [output] = result.output;
  expect(output.code).toBe("'use strict';\n\nconst foo = 'bar';\n\nexports.foo = foo;\n");
});

test('cjs output for ts export', async () => {
  const bundle = await rollup({
    input: 'test/fixtures/test.ts',
    plugins: [swc()]
  });
  const result = await bundle.generate({ format: 'cjs' });
  expect(result.output.length).toBe(1);
  const [output] = result.output;
  expect(output.code).toBe(
    "'use strict';\n\nfunction add(a, b) {\n    return a + b;\n}\n\nexports.add = add;\n"
  );
});

test('esm output for export', async () => {
  const bundle = await rollup({
    input: 'test/fixtures/export.js',
    plugins: [swc()]
  });
  const result = await bundle.generate({ format: 'esm' });
  expect(result.output.length).toBe(1);
  const [output] = result.output;
  expect(output.code).toBe("const foo = 'bar';\n\nexport { foo };\n");
});

test('work with source map', async () => {
  const bundle = await rollup({
    input: 'test/fixtures/unminified.js',
    plugins: [swc()]
  });
  const result = await bundle.generate({ format: 'cjs', sourcemap: true });

  expect(result.output.length).toBe(2);

  const [file, sourceMap] = result.output;

  expect(file.fileName).toBe('unminified.js');
  expect(file.type).toBe('chunk');
  expect(file.name).toBe('unminified');
  expect(file.type).toBe('chunk');
  expect(file.map.version).toBe(3);
  expect(file.map.file).toBe('unminified.js');
  expect(file.map.names).toEqual(['window', 'a', 'console', 'log']);

  expect(sourceMap.fileName).toBe('unminified.js.map');
  expect(sourceMap.type).toBe('asset');
});

test('allow passing swc.env', async () => {
  const bundle = await rollup({
    input: 'test/fixtures/export-default.js',
    plugins: [
      swc({
        env: {
          targets: ['es2020'],
          shippedProposals: true
        }
      })
    ]
  });
  const result = await bundle.generate({ format: 'cjs' });
  expect(result.output.length).toBe(1);
  const [output] = result.output;
  expect(output.code).toBe(
    "'use strict';\n\nvar exportDefault = 5;\n\nmodule.exports = exportDefault;\n"
  );
});

test('catch error on jsc and env option', async () => {
  await expect(
    rollup({
      input: 'test/fixtures/export-default.js',
      plugins: [
        swc({
          swc: {
            jsc: {
              target: 'es2020'
            },
            env: {
              targets: ['es2022'],
              shippedProposals: true
            }
          }
        })
      ]
    }).then((bundle) => bundle.generate({ format: 'cjs' }))
  ).rejects.toThrow('`env` and `jsc.target` cannot be used together');
});
