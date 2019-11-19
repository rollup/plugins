[npm]: https://img.shields.io/npm/v/@rollup/plugin-url
[npm-url]: https://www.npmjs.com/package/@rollup/plugin-url
[size]: https://packagephobia.now.sh/badge?p=@rollup/plugin-url
[size-url]: https://packagephobia.now.sh/result?p=@rollup/plugin-url

[![npm][npm]][npm-url]
[![size][size]][size-url]
[![libera manifesto](https://img.shields.io/badge/libera-manifesto-lightgrey.svg)](https://liberamanifesto.com)

# @rollup/plugin-url

🍣 A Rollup plugin which imports files as data-URIs or to ES6 modules.

## Requirements

This plugin requires an [LTS](https://github.com/nodejs/Release) Node version (v8.0.0+) and Rollup v1.20.0+.

## Install

Using npm:

```console
npm install @rollup/plugin-url --save-dev
```

## Usage

Create a `rollup.config.js` [configuration file](https://www.rollupjs.org/guide/en/#configuration-files) and import the plugin:

```js
import url from "@rollup/plugin-url";

export default {
  input: "src/index.js",
  output: {
    dir: "output",
    format: "cjs"
  },
  plugins: [url()]
};
```

Then call `rollup` either via the [CLI](https://www.rollupjs.org/guide/en/#command-line-reference) or the [API](https://www.rollupjs.org/guide/en/#javascript-api).

With an accompanying file `src/index.js`, the local `image.svg` file would now be importable as seen below:

```js
// src/index.js
import svg from "./image.svg";
console.log(`svg contents: ${svg}`);
```

## Options

### limit

Optional. Type: `number`.

This is the file size limit to inline files. If files exceed this limit, they
will be copied instead to the destination folder and the hashed filename will
be given instead. If value set to `0` all files will be copied.

Defaults to 14336 (14kb).

### include / exclude

Optional. Type: a minimatch pattern, or array of minimatch patterns

These patterns determine which files are inlined. Defaults to .svg, .png, .jpg
and .gif files.

### publicPath

Optional. Type: `string`

The `publicPath` will be added in front of file names when they are not inlined
but copied.

### emitFiles

Optional. Type: `boolean`

The `emitFiles` option is used to run the plugin as you normally would but prevents any files being emitted. This is useful for when you are using rollup to emit both a client side and server side bundle.

### fileName

Optional. Type: `string`

When `emitFiles` is `true`, the `fileName` option can be used to rename the emitted files. It accepts the following string replacements:

- `[hash]` - The hash value of the file's contents
- `[name]` - The name of the imported file, without it's file extension
- `[extname]` - The extension of the imported file, including the leading `.`
- `[dirname]` - The parent directory name of the imported file, including trailing `/`

Defaults to: `"[hash][extname]"`

### sourceDir

Optional. Type: `string`

When using the `[dirname]` replacement in `fileName`, uses this directory as the source directory to create the file path from rather than the parent directory of the imported file. For example:

_src/path/to/file.js_

```js
import png from "./image.png";
```

_rollup.config.js_

```js
url({
  fileName: "[dirname][hash][extname]",
  sourceDir: path.join(__dirname, "src")
});
```

Emitted File: `path/to/image.png`

### destDir

Optional. Type: `string`

The destination dir to copy assets, usually used to rebase the assets according to HTML files.

## Meta

[CONTRIBUTING](/.github/CONTRIBUTING.md)

[LICENSE (MIT)](/LICENSE)
