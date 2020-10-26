[npm]: https://img.shields.io/npm/v/@rollup/plugin-alias
[npm-url]: https://www.npmjs.com/package/@rollup/plugin-alias
[size]: https://packagephobia.now.sh/badge?p=@rollup/plugin-alias
[size-url]: https://packagephobia.now.sh/result?p=@rollup/plugin-alias

[![npm][npm]][npm-url]
[![size][size]][size-url]
[![libera manifesto](https://img.shields.io/badge/libera-manifesto-lightgrey.svg)](https://liberamanifesto.com)

# @rollup/plugin-eslint

🍣 A Rollup plugin to lint entry points and all imported files with ESLint.

## Install

Using npm:

```console
npm install @rollup/plugin-eslint --save-dev
# or
yarn add -D @rollup/plugin-eslint
```

## Usage

```js
import eslint from '@rollup/plugin-eslint';

export default {
  input: 'main.js',
  plugins: [
    eslint({
      /* your options */
    })
  ]
};
```

## Options

See more options here [eslint-config](http://eslint.org/docs/developer-guide/nodejs-api#cliengine).

You can also use eslint configuration in the form of a `.eslintrc.*` file in your project's root. It will be loaded automatically.

### fix

Type: `Boolean`<br>
Default: `false`

If true, will auto fix source code.

### throwOnError

Type: `Boolean`<br>
Default: `false`

If true, will throw an error if any errors were found.

### throwOnWarning

Type: `Boolean`<br>
Default: `false`

If true, will throw an error if any warnings were found.

### include

Type: `Array | String`<br>
Default: `[]`

A single file, or array of files, to include when linting.

### exclude

Type: `Array | String`<br>
Default: `node_modules/**`

A single file, or array of files, to exclude when linting.

### formatter

Type: `Function | String`<br>
Default: `stylish`

Custom error formatter or the name of a built-in formatter.

## Meta

[CONTRIBUTING](/.github/CONTRIBUTING.md)

[LICENSE (MIT)](/LICENSE)
