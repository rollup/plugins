[npm]: https://img.shields.io/npm/v/@rollup/plugin-terser
[npm-url]: https://www.npmjs.com/package/@rollup/plugin-terser
[size]: https://packagephobia.now.sh/badge?p=@rollup/plugin-terser
[size-url]: https://packagephobia.now.sh/result?p=@rollup/plugin-terser

[![npm][npm]][npm-url]
[![size][size]][size-url]
[![libera manifesto](https://img.shields.io/badge/libera-manifesto-lightgrey.svg)](https://liberamanifesto.com)

# @rollup/plugin-terser

🍣 A Rollup plugin to generate a minified output bundle wiht terser.

## Requirements

This plugin requires an [LTS](https://github.com/nodejs/Release) Node version (v14.0.0+) and Rollup v2.0+.

## Install

Using npm:

```console
npm install @rollup/plugin-terser --save-dev
```

## Usage

Create a `rollup.config.js` [configuration file](https://www.rollupjs.org/guide/en/#configuration-files) and import the plugin:

```typescript
import terser from '@rollup/plugin-terser';

export default {
  input: 'src/index.js',
  output: {
    dir: 'output',
    format: 'cjs'
  },
  plugins: [terser()]
};
```

Then call `rollup` either via the [CLI](https://www.rollupjs.org/guide/en/#command-line-reference) or the [API](https://www.rollupjs.org/guide/en/#javascript-api).

## Options

The plugin accepts a terser [Options](https://github.com/terser/terser#minify-options) object as input parameter,
to modify the default behaviour.

Besides, the terser options, it is also possible to pass the option `maxWorkers`,
which allows to control how many workers can run at the same time.

```typescript
import terser from '@rollup/plugin-terser';

export default {
  input: 'src/index.js',
  output: {
    dir: 'output',
    format: 'cjs'
  },
  plugins: [
    terser({
      maxWorkers: 4
    })
  ]
};
```

## Meta

[CONTRIBUTING](/.github/CONTRIBUTING.md)

[LICENSE (MIT)](/LICENSE)

## Credits

The original terser plugin was developed by [TrySound](https://github.com/TrySound) but is not
maintained anymore.
The current implementation is developed and maintained by [tada5hi](https://github.com/tada5hi).
