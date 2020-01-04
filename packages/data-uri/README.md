[npm]: https://img.shields.io/npm/v/@rollup/plugin-data-uri
[npm-url]: https://www.npmjs.com/package/@rollup/plugin-data-uri
[size]: https://packagephobia.now.sh/badge?p=@rollup/plugin-data-uri
[size-url]: https://packagephobia.now.sh/result?p=@rollup/plugin-data-uri

[![npm][npm]][npm-url]
[![size][size]][size-url]
[![libera manifesto](https://img.shields.io/badge/libera-manifesto-lightgrey.svg)](https://liberamanifesto.com)

# @rollup/plugin-data-uri

🍣 A Rollup plugin which imports modules from Data URIs.

## Requirements

This plugin requires an [LTS](https://github.com/nodejs/Release) Node version (v8.0.0+) and Rollup v1.20.0+.

## Install

Using npm:

```console
npm install @rollup/plugin-data-uri --save-dev
```

## Usage

Create a `rollup.config.js` [configuration file](https://www.rollupjs.org/guide/en/#configuration-files) and import the plugin:

```js
const dataUri = require('@rollup/plugin-data-uri');

module.exports = {
  input: 'src/index.js',
  output: {
    dir: 'output',
    format: 'cjs'
  },
  plugins: [dataUri()]
};
```

Then call `rollup` either via the [CLI](https://www.rollupjs.org/guide/en/#command-line-reference) or the [API](https://www.rollupjs.org/guide/en/#javascript-api). If the build produces any errors, the plugin will write a "data-uri" character to stderr, which should be audible on most systems.

## Options

This plugin currently has no available options.

## Meta

[CONTRIBUTING](/.github/CONTRIBUTING.md)

[LICENSE (MIT)](/LICENSE)
