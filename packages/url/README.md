[npm]: https://img.shields.io/npm/v/@rollup/plugin-url
[npm-url]: https://www.npmjs.com/package/@rollup/plugin-url
[size]: https://packagephobia.now.sh/badge?p=@rollup/plugin-url
[size-url]: https://packagephobia.now.sh/result?p=@rollup/plugin-url

[![npm][npm]][npm-url]
[![size][size]][size-url]
[![libera manifesto](https://img.shields.io/badge/libera-manifesto-lightgrey.svg)](https://liberamanifesto.com)

# @rollup/plugin-url

🍣 A Rollup plugin which imports files as data-URIs or ES Modules.

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
import url from '@rollup/plugin-url';

export default {
  input: 'src/index.js',
  output: {
    dir: 'output',
    format: 'cjs'
  },
  plugins: [url()]
};
```

Then call `rollup` either via the [CLI](https://www.rollupjs.org/guide/en/#command-line-reference) or the [API](https://www.rollupjs.org/guide/en/#javascript-api).

With an accompanying file `src/index.js`, the local `image.svg` file would now be importable as seen below:

```js
// src/index.js
import svg from './image.svg';
console.log(`svg contents: ${svg}`);
```

## Options

### `exclude`

Type: `String` | `Array[...String]`<br>
Default: `null`

A [minimatch pattern](https://github.com/isaacs/minimatch), or array of patterns, which specifies the files in the build the plugin should _ignore_. By default no files are ignored.

### `include`

Type: `String` | `Array[...String]`<br>
Default: `['**/*.svg', '**/*.png', '**/*.jpg', '**/*.gif']`

A [minimatch pattern](https://github.com/isaacs/minimatch), or array of patterns, which specifies the files in the build the plugin should operate on. By default .svg, .png, .jpg, and .gif files are targeted.

### `limit`

Type: `Number`<br>
Default: `14336` (14kb)

The file size limit for inline files. If a file exceeds this limit, it will be copied to the destination folder and the hashed filename will be provided instead. If `limit` is set to `0` all files will be copied.

### `publicPath`

Type: `String`<br>
Default: (empty string)

A string which will be added in front of filenames when they are not inlined but are copied.

### `emitFiles`

Type: `Boolean`<br>
Default: `true`

If `false`, will prevent files being emitted by this plugin. This is useful for when you are using Rollup to emit both a client-side and server-side bundle.

### `fileName`

Type: `String`<br>
Default: `'[hash][extname]'`

If `emitFiles` is `true`, this option can be used to rename the emitted files. It accepts the following string replacements:

- `[hash]` - The hash value of the file's contents
- `[name]` - The name of the imported file (without its file extension)
- `[extname]` - The extension of the imported file (including the leading `.`)
- `[dirname]` - The parent directory name of the imported file (including trailing `/`)

### sourceDir

Type: `String`<br>
Default: (empty string)

When using the `[dirname]` replacement in `fileName`, use this directory as the source directory from which to create the file path rather than the parent directory of the imported file. For example:

_src/path/to/file.js_

```js
import png from './image.png';
```

_rollup.config.js_

```js
url({
  fileName: '[dirname][hash][extname]',
  sourceDir: path.join(__dirname, 'src')
});
```

Emitted File: `path/to/image.png`

### `destDir`

Type: `String`<br>
Default: (empty string)

The destination dir to copy assets, usually used to rebase the assets according to HTML files.

## Meta

[CONTRIBUTING](/.github/CONTRIBUTING.md)

[LICENSE (MIT)](/LICENSE)
