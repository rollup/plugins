const css = require('rollup-plugin-postcss');

const pkg = require('./package.json');

const dependencies = Object.keys(pkg.dependencies || {});

const html = require('.');

export default [
  {
    input: ['test/fixtures/joker.js'],
    output: { dir: 'dist', format: 'cjs' },
    external: [...dependencies],
    plugins: [css({ extract: true }), html()]
  }
];
