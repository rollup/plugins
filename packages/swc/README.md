[npm]: https://img.shields.io/npm/v/@rollup/plugin-swc
[npm-url]: https://www.npmjs.com/package/@rollup/plugin-swc
[size]: https://packagephobia.now.sh/badge?p=@rollup/plugin-swc
[size-url]: https://packagephobia.now.sh/result?p=@rollup/plugin-swc

[![npm][npm]][npm-url]
[![size][size]][size-url]
[![libera manifesto](https://img.shields.io/badge/libera-manifesto-lightgrey.svg)](https://liberamanifesto.com)

# @rollup/plugin-swc

🍣 A Rollup plugin to transpile TypeScript/JavaScript with the speedy-web-compiler (swc).

The plugin makes it possible to avoid the usage of `@rollup/plugin-babel` and `@rollup/plugin-typescript`.
It is also blazingly fast 🔥 ( between 20 - 70 times faster than babel depending on how many cpu cores are used).

## Requirements

This plugin requires an [LTS](https://github.com/nodejs/Release) Node version (v10.0.0+) and Rollup v2.0+.

## Install

Using npm:

```console
npm install @rollup/plugin-swc --save-dev
```

## Usage

Create a `rollup.config.js` [configuration file](https://www.rollupjs.org/guide/en/#configuration-files) and import the plugin:

```typescript
import swc from '@rollup/plugin-swc';

export default {
  input: 'src/index.js',
  output: {
    dir: 'output',
    format: 'cjs'
  },
  plugins: [swc()]
};
```

Then call `rollup` either via the [CLI](https://www.rollupjs.org/guide/en/#command-line-reference) or the [API](https://www.rollupjs.org/guide/en/#javascript-api).

## Options

The plugin accepts a swc [Options](https://swc.rs/docs/configuration/swcrc) object as input parameter,
to modify the default behaviour.

## Meta

[CONTRIBUTING](/.github/CONTRIBUTING.md)

[LICENSE (MIT)](/LICENSE)
