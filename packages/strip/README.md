[npm]: https://img.shields.io/npm/v/@rollup/plugin-strip
[npm-url]: https://www.npmjs.com/package/@rollup/plugin-strip
[size]: https://packagephobia.now.sh/badge?p=@rollup/plugin-strip
[size-url]: https://packagephobia.now.sh/result?p=@rollup/plugin-strip

[![npm][npm]][npm-url]
[![size][size]][size-url]
[![libera manifesto](https://img.shields.io/badge/libera-manifesto-lightgrey.svg)](https://liberamanifesto.com)

# @rollup/plugin-strip

🍣 A Rollup plugin to remove `debugger` statements and functions like `assert.equal` and `console.log` from your code.

## Requirements

This plugin requires an [LTS](https://github.com/nodejs/Release) Node version (v8.0.0+) and Rollup v1.20.0+.

## Install

Using npm:

```console
npm install @rollup/plugin-strip --save-dev
```

## Usage

Create a `rollup.config.js` [configuration file](https://www.rollupjs.org/guide/en/#configuration-files) and import the plugin:

```js
import strip from '@rollup/plugin-strip';

export default {
  input: 'src/index.js',
  output: {
    dir: 'output',
    format: 'cjs'
  },
  plugins: [
    strip({
      labels: ['unittest']
    })
  ]
};
```

Then call `rollup` either via the [CLI](https://www.rollupjs.org/guide/en/#command-line-reference) or the [API](https://www.rollupjs.org/guide/en/#javascript-api).

## Options

### `include`

Type: `String | RegExp | Array[...String|RegExp]`<br>
Default: `['**/*.js']`<br>
Example: `include: '**/*.(mjs|js)',`<br>

A pattern, or array of patterns, which specify the files in the build the plugin should operate on.

### `exclude`

Type: `String | RegExp | Array[...String|RegExp]`<br>
Default: `[]`<br>
Example: `exlude: 'tests/**/*',`<br>

A pattern, or array of patterns, which specify the files in the build the plugin should _ignore_.

### `debugger`

Type: `Boolean`<br>
Default: `true`<br>
Example: `debugger: false,`<br>

If `true` instructs the plugin to remove debugger statements.

### `functions`

Type: `Array[...String]`<br>
Default: `[ 'console.*', 'assert.*' ]`<br>
Example: `functions: [ 'console.log', 'MyClass.Test' ],`<br>

Specifies the functions that the plugin will target and remove.

_Note: specifying functions that are used at the begining of a chain, such as 'a().b().c()', will result in '(void 0).b().c()' which will generate an error at runtime._

### `labels`

Type: `Array[...String]`<br>
Default: `[]`<br>
Example: `labels: ['unittest'],`<br>

Specifies the [labeled blocks or statements](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/label) that the plugin will target and remove.

_Note: the '**:**' is implied and should not be specified in the config._

### `sourceMap`

Type: `Boolean`<br>
Default: `true`<br>
Example: `sourceMap: false,`<br>

If `true`, instructs the plugin to update source maps accordingly after removing configured targets from the bundle.

## Meta

[CONTRIBUTING](/.github/CONTRIBUTING.md)

[LICENSE (MIT)](/LICENSE)
