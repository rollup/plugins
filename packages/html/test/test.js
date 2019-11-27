const { readFileSync } = require('fs');
const { join } = require('path');

const test = require('ava');
const del = require('del');
const { rollup } = require('rollup');
const css = require('rollup-plugin-postcss');

const html = require('..');

const read = (file = 'index.html') => readFileSync(join('output/', file), 'utf-8');

const output = { dir: 'output', format: 'cjs' };

process.chdir(join(__dirname, 'fixtures'));

test.afterEach(() => del('output'));

test.serial('default options', async (t) => {
  const bundle = await rollup({
    input: 'batman.js',
    plugins: [html()]
  });
  await bundle.write(output);
  t.snapshot(read());
});

test.serial('options', async (t) => {
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
  await bundle.write(output);
  t.snapshot(read('batman.html'));
});

test.serial('css', async (t) => {
  const bundle = await rollup({
    input: 'joker.js',
    plugins: [css({ extract: true }), html()]
  });
  await bundle.write(output);
  t.snapshot(read());
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
  await bundle.write(output);
  t.snapshot(read());
});

test.serial('imports', async (t) => {
  const bundle = await rollup({
    input: 'robin.js',
    plugins: [html()]
  });
  await bundle.write(output);
  t.snapshot(read());
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
  await bundle.write(output);
  t.snapshot(read());
});
