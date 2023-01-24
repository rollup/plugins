const test = require('ava');
const { rollup } = require('rollup');

const terser = require('../');

const CJSShim = `
// -- CommonJS Shims --
import cjsUrl from 'url';
import cjsPath from 'path';
import cjsMod from 'module';
const __filename = cjsUrl.fileURLToPath(import.meta.url);
const __dirname = cjsPath.dirname(__filename);
const require = cjsMod.createRequire(import.meta.url);
`;

test.serial('inject cjs shim for esm output', async (t) => {
  const bundle = await rollup({
    input: 'test/fixtures/cjs.js',
    plugins: [terser()]
  });
  const result = await bundle.generate({ format: 'es' });
  t.is(result.output.length, 1);
  const [output] = result.output;
  t.is(output.code, `${CJSShim}const child = require('child');\n\nexport { child };\n`);
  t.falsy(output.map);
});

test.serial('inject cjs shim for esm output with sourcemap', async (t) => {
  const bundle = await rollup({
    input: 'test/fixtures/cjs.js',
    plugins: [terser()]
  });
  const result = await bundle.generate({ format: 'es', sourcemap: true });
  t.is(result.output.length, 2);
  const [output, map] = result.output;
  t.is(
    output.code,
    `${CJSShim}const child = require('child');\n\nexport { child };\n//# sourceMappingURL=cjs.js.map\n`
  );
  t.truthy(output.map);
  t.is(output.map.file, 'cjs.js');
  t.deepEqual(output.map.sources, ['test/fixtures/cjs.js']);
  t.is(map.fileName, 'cjs.js.map');
});

test.serial('not inject cjs shim for cjs output', async (t) => {
  const bundle = await rollup({
    input: 'test/fixtures/cjs.js',
    plugins: [terser()]
  });
  const result = await bundle.generate({ format: 'cjs' });
  t.is(result.output.length, 1);
  const [output] = result.output;
  t.is(output.code, `'use strict';\n\nconst child = require('child');\n\nexports.child = child;\n`);
  t.falsy(output.map);
});
