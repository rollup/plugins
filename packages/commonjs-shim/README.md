[npm]: https://img.shields.io/npm/v/@rollup/plugin-commonjs-shim
[npm-url]: https://www.npmjs.com/package/@rollup/plugin-commonjs-shim
[size]: https://packagephobia.now.sh/badge?p=@rollup/plugin-commonjs-shim
[size-url]: https://packagephobia.now.sh/result?p=@rollup/plugin-commonjs-shim

[![npm][npm]][npm-url]
[![size][size]][size-url]
[![libera manifesto](https://img.shields.io/badge/libera-manifesto-lightgrey.svg)](https://liberamanifesto.com)

# @rollup/plugin-commonjs-shim

🍣 A Rollup plugin to replace CJS syntax like `__filename`, `__dirname`, ... for esm output bundles.

## Requirements

This plugin requires an [LTS](https://github.com/nodejs/Release) Node version (v14.0.0+) and Rollup v2.0+.

## Install

Using npm:

```console
npm install @rollup/plugin-commonjs-shim --save-dev
```

## Usage

Create a `rollup.config.js` [configuration file](https://www.rollupjs.org/guide/en/#configuration-files) and import the plugin:

```typescript
import commonjsShim from '@rollup/plugin-commonjs-shim';

export default {
  input: 'src/index.js',
  output: {
    dir: 'output',
    format: 'cjs'
  },
  plugins: [commonjsShim()]
};
```

Then call `rollup` either via the [CLI](https://www.rollupjs.org/guide/en/#command-line-reference) or the [API](https://www.rollupjs.org/guide/en/#javascript-api).

## Meta

[CONTRIBUTING](/.github/CONTRIBUTING.md)

[LICENSE (MIT)](/LICENSE)
