const { join } = require('path');

const test = require('ava');
const { rollup } = require('rollup');
const css = require('rollup-plugin-postcss');

const { getCode } = require('../../../util/test');

const html = require('..');

// const read = (file = 'index.html') => readFileSync(join('output/', file), 'utf-8');

const output = { dir: 'output', format: 'umd' };

process.chdir(join(__dirname, 'fixtures'));

test('default options', async (t) => {
  const bundle = await rollup({
    input: 'batman.js',
    plugins: [html()]
  });
  const code = await getCode(bundle, output, true);
  t.snapshot(code);
});

test('options', async (t) => {
  const bundle = await rollup({
    input: 'batman.js',
    plugins: [
      html({
        fileName: 'batman.html',
        publicPath: 'batcave/',
        title: 'Batcave'
      })
    ]
  });
  const code = await getCode(bundle, output, true);
  t.snapshot(code);
});

test('iife', async (t) => {
  const bundle = await rollup({
    input: 'batman.js',
    plugins: [html()]
  });
  const code = await getCode(bundle, { dir: 'output', format: 'iife' }, true);
  t.snapshot(code);
});

test('esm', async (t) => {
  const bundle = await rollup({
    input: 'batman.js',
    plugins: [html()]
  });
  const code = await getCode(bundle, { dir: 'output', format: 'esm' }, true);
  t.snapshot(code);
});

test('unsupported output format', async (t) => {
  const warnings = [];
  const bundle = await rollup({
    input: 'batman.js',
    onwarn: (warning) => warnings.push(warning),
    plugins: [html()]
  });
  const code = await getCode(bundle, { dir: 'output', format: 'cjs' }, true);
  t.snapshot(code);
  t.snapshot(warnings);
});

test('css', async (t) => {
  const bundle = await rollup({
    input: 'joker.js',
    plugins: [css({ extract: true }), html()]
  });
  const code = await getCode(bundle, output, true);
  t.snapshot(code);
});

test('attributes', async (t) => {
  const bundle = await rollup({
    input: 'joker.js',
    plugins: [
      css({ extract: true }),
      html({
        attributes: {
          html: { batsignal: 'on', lang: 'bat' },
          link: { 'data-vilian': 'joker' },
          script: { defer: true }
        }
      })
    ]
  });
  const code = await getCode(bundle, output, true);
  t.snapshot(code);
});

test('imports', async (t) => {
  const bundle = await rollup({
    input: 'robin.js',
    plugins: [html()]
  });
  const code = await getCode(bundle, output, true);
  t.snapshot(code);
});

test('template', async (t) => {
  const bundle = await rollup({
    input: 'batman.js',
    plugins: [
      html({
        template: () => '<html><body><main></main></body></html>'
      })
    ]
  });
  const code = await getCode(bundle, output, true);
  t.snapshot(code);
});
