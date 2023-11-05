const test = require('ava');
const { rollup } = require('rollup');

const swc = require('../');

test.serial('cjs output for default export', async (t) => {
  const bundle = await rollup({
    input: 'test/fixtures/export-default.js',
    plugins: [swc()]
  });
  const result = await bundle.generate({ format: 'cjs' });
  t.is(result.output.length, 1);
  const [output] = result.output;
  t.is(output.code, "'use strict';\n\nvar exportDefault = 5;\n\nmodule.exports = exportDefault;\n");
});

test.serial('esm output for default export', async (t) => {
  const bundle = await rollup({
    input: 'test/fixtures/export-default.js',
    plugins: [swc()]
  });
  const result = await bundle.generate({ format: 'esm' });
  t.is(result.output.length, 1);
  const [output] = result.output;
  t.is(output.code, 'var exportDefault = 5;\n\nexport { exportDefault as default };\n');
});

test.serial('cjs output for export', async (t) => {
  const bundle = await rollup({
    input: 'test/fixtures/export.js',
    plugins: [swc()]
  });
  const result = await bundle.generate({ format: 'cjs' });
  t.is(result.output.length, 1);
  const [output] = result.output;
  t.is(output.code, "'use strict';\n\nconst foo = 'bar';\n\nexports.foo = foo;\n");
});

test.serial('cjs output for ts export', async (t) => {
  const bundle = await rollup({
    input: 'test/fixtures/test.ts',
    plugins: [swc()]
  });
  const result = await bundle.generate({ format: 'cjs' });
  t.is(result.output.length, 1);
  const [output] = result.output;
  t.is(
    output.code,
    "'use strict';\n\nfunction add(a, b) {\n    return a + b;\n}\n\nexports.add = add;\n"
  );
});

test.serial('esm output for export', async (t) => {
  const bundle = await rollup({
    input: 'test/fixtures/export.js',
    plugins: [swc()]
  });
  const result = await bundle.generate({ format: 'esm' });
  t.is(result.output.length, 1);
  const [output] = result.output;
  t.is(output.code, "const foo = 'bar';\n\nexport { foo };\n");
});

test.serial('work with source map', async (t) => {
  const bundle = await rollup({
    input: 'test/fixtures/unminified.js',
    plugins: [swc()]
  });
  const result = await bundle.generate({ format: 'cjs', sourcemap: true });

  t.is(result.output.length, 2);

  const [file, sourceMap] = result.output;

  t.is(file.fileName, 'unminified.js');
  t.is(file.type, 'chunk');
  t.is(file.name, 'unminified');
  t.is(file.type, 'chunk');
  t.is(file.map.version, 3);
  t.is(file.map.file, 'unminified.js');
  t.deepEqual(file.map.names, ['window', 'a', 'console', 'log']);

  t.is(sourceMap.fileName, 'unminified.js.map');
  t.is(sourceMap.type, 'asset');
});

test.serial('allow passing swc.env', async (t) => {
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
  t.is(result.output.length, 1);
  const [output] = result.output;
  t.is(output.code, "'use strict';\n\nvar exportDefault = 5;\n\nmodule.exports = exportDefault;\n");
});

test.serial('catch error on jsc and env option', async (t) => {
  try {
    const bundle = await rollup({
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
    });

    await bundle.generate({ format: 'cjs' });
    t.is(0, 1);
  } catch (e) {
    t.is(e.message, '`env` and `jsc.target` cannot be used together');
  }
});
