[npm]: https://img.shields.io/npm/v/@rollup/plugin-image
[npm-url]: https://www.npmjs.com/package/@rollup/plugin-image
[size]: https://packagephobia.now.sh/badge?p=@rollup/plugin-image
[size-url]: https://packagephobia.now.sh/result?p=@rollup/plugin-image

[![npm][npm]][npm-url]
[![size][size]][size-url]
[![libera manifesto](https://img.shields.io/badge/libera-manifesto-lightgrey.svg)](https://liberamanifesto.com)

# @rollup/plugin-image

🍣 A Rollup plugin which imports JPG, PNG, GIF, SVG, and WebP files.

Images are encoded using base64, which means they will be 33% larger than the size on disk. You should therefore only use this for small images where the convenience of having them available on startup (e.g. rendering immediately to a canvas without co-ordinating asynchronous loading of several images) outweighs the cost.

## Requirements

This plugin requires an [LTS](https://github.com/nodejs/Release) Node version (v14.0.0+) and Rollup v1.20.0+.

## Install

Using npm:

```console
npm install @rollup/plugin-image --save-dev
```

## Usage

Assuming a `src/index.js` exists and contains code like the following:

```js
import logo from './rollup.png';

console.log(logo);
```

Create a `rollup.config.js` [configuration file](https://www.rollupjs.org/guide/en/#configuration-files) and import the plugin:

```js
import image from '@rollup/plugin-image';

export default {
  input: 'src/index.js',
  output: {
    dir: 'output',
    format: 'cjs'
  },
  plugins: [image()]
};
```

Then call `rollup` either via the [CLI](https://www.rollupjs.org/guide/en/#command-line-reference) or the [API](https://www.rollupjs.org/guide/en/#javascript-api).

Once the bundle is executed, the `console.log` will display the Base64 encoded representation of the image.

## Options

### `dom`

Type: `Boolean`<br>
Default: `false`

If `true`, instructs the plugin to generate an ES Module which exports a DOM `Image` which can be used with a browser's DOM. Otherwise, the plugin generates an ES Module which exports a `default const` containing the Base64 representation of the image.

Using this option set to `true`, the export can be used as such:

```js
import logo from './rollup.png';
document.body.appendChild(logo);
```

### `exclude`

Type: `String` | `Array[...String]`<br>
Default: `null`

A [picomatch pattern](https://github.com/micromatch/picomatch), or array of patterns, which specifies the files in the build the plugin should _ignore_. By default no files are ignored.

### `include`

Type: `String` | `Array[...String]`<br>
Default: `null`

A [picomatch pattern](https://github.com/micromatch/picomatch), or array of patterns, which specifies the files in the build the plugin should operate on. By default all files are targeted.

## Meta

[CONTRIBUTING](/.github/CONTRIBUTING.md)

[LICENSE (MIT)](/LICENSE)
