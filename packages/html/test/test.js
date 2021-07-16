const { join } = require('path');

const test = require('ava');
const { rollup } = require('rollup');
const css = require('rollup-plugin-postcss');

const { getCode } = require('../../../util/test');

const html = require('../dist');

// const read = (file = 'index.html') => readFileSync(join('output/', file), 'utf-8');

const output = { dir: 'output', format: 'umd' };

process.chdir(join(__dirname, 'fixtures'));

test.serial('default options', async (t) => {
  const bundle = await rollup({
    input: 'batman.js',
    plugins: [html()]
  });
  const code = await getCode(bundle, output, true);
  t.snapshot(code);
});

test.serial('options', async (t) => {
  const bundle = await rollup({
    input: 'batman.js',
    plugins: [
      html({
        fileName: 'batman.html',
        publicPath: 'batcave/',
        title: 'Batcave',
        meta: [
          { charset: 'utf-8' },
          { name: 'viewport', content: 'minimum-scale=1, initial-scale=1, width=device-width' }
        ]
      })
    ]
  });
  const code = await getCode(bundle, output, true);
  t.snapshot(code);
});

test.serial('iife', async (t) => {
  const bundle = await rollup({
    input: 'batman.js',
    plugins: [html()]
  });
  const code = await getCode(bundle, { dir: 'output', format: 'iife' }, true);
  t.snapshot(code);
});

test.serial('esm', async (t) => {
  const bundle = await rollup({
    input: 'batman.js',
    plugins: [html()]
  });
  const code = await getCode(bundle, { dir: 'output', format: 'esm' }, true);
  t.snapshot(code);
});

test.serial('unsupported output format', async (t) => {
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

test.serial('css', async (t) => {
  const bundle = await rollup({
    input: 'joker.js',
    plugins: [css({ extract: true }), html()]
  });
  const code = await getCode(bundle, output, true);
  t.snapshot(code);
});

test.serial('attributes', async (t) => {
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

test.serial('imports', async (t) => {
  const bundle = await rollup({
    input: 'robin.js',
    plugins: [html()]
  });
  const code = await getCode(bundle, output, true);
  t.snapshot(code);
});

test.serial('template', async (t) => {
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
