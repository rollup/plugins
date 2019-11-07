[npm]: https://img.shields.io/npm/v/@rollup/plugin-beep
[npm-url]: https://www.npmjs.com/package/@rollup/plugin-beep
[size]: https://packagephobia.now.sh/badge?p=@rollup/plugin-beep
[size-url]: https://packagephobia.now.sh/result?p=@rollup/plugin-beep

[![npm][npm]][npm-url]
[![size][size]][size-url]
[![libera manifesto](https://img.shields.io/badge/libera-manifesto-lightgrey.svg)](https://liberamanifesto.com)

# @rollup/plugin-beep

🍣 A Rollup plugin that beeps when a build ends with errors.

## Requirements

This plugin requires an [LTS](https://github.com/nodejs/Release) Node version (v8.0.0+) and Rollup v1.20.0+.

## Install

Using npm:

```console
npm install @rollup/plugin-beep --save-dev
```

## Usage

Create a `rollup.config.js` [configuration file](https://www.rollupjs.org/guide/en/#configuration-files) and import the plugin:

```js
const beep = require('@rollup/plugin-beep');

module.exports = {
  input: 'src/index.js',
  output: {
    dir: 'output',
    format: 'cjs'
  },
  plugins: [beep()]
};
```

Then call `rollup` either via the [CLI](https://www.rollupjs.org/guide/en/#command-line-reference) or the [API](https://www.rollupjs.org/guide/en/#javascript-api). If the build produces any errors, the plugin will write a "beep" character to stderr, which should be audible on most systems.

## Options

This plugin currently has no available options.

## Meta

[CONTRIBUTING](/.github/CONTRIBUTING.md)

[LICENSE (MIT)](/LICENSE)
