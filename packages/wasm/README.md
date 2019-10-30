[cover]: https://codecov.io/gh/rollup/plugins/replace/branch/master/graph/badge.svg
[cover-url]: https://codecov.io/gh/rollup/plugins
[size]: https://packagephobia.now.sh/badge?p=@rollup/plugin-wasm
[size-url]: https://packagephobia.now.sh/result?p=@rollup/plugin-wasm
[tests]: https://img.shields.io/circleci/project/github/rollup/plugins.svg
[tests-url]: https://circleci.com/gh/rollup/plugins

[![tests][tests]][tests-url]
[![cover][cover]][cover-url]
[![size][size]][size-url]
[![libera manifesto](https://img.shields.io/badge/libera-manifesto-lightgrey.svg)](https://liberamanifesto.com)

# @rollup/plugin-wasm

🍣 A Rollup which allows importing and bundling [WebAssembly modules](http://webassembly.org).

WebAssembly Modules are imported asynchronous as base64 strings. Small modules [can be imported synchronously](#synchronous-modules).

## Requirements

This plugin requires an [LTS](https://github.com/nodejs/Release) Node version (v8.0.0+) and Rollup v1.20.0+.

## Install

Using npm:

```console
npm install @rollup/plugin-wasm --save-dev
```

## Usage

Create a `rollup.config.js` [configuration file](https://www.rollupjs.org/guide/en/#configuration-files) and import the plugin:

```js
import wasm from '@rollup/plugin-wasm';

export default {
  input: 'src/index.js',
  output: {
    dir: 'output',
    format: 'cjs'
  },
  plugins: [wasm()]
};
```

Then call `rollup` either via the [CLI](https://www.rollupjs.org/guide/en/#command-line-reference) or the [API](https://www.rollupjs.org/guide/en/#javascript-api).

## Options

In addition to the properties and values specified for replacement, users may also specify the options below.

### `sync`

Type: `Array[String]`
Default: `null`

Specifies an array of strings that each represent a WebAssembly file to load synchronously. See [Synchronous Modules](#synchronous-modules) for a functional example.

## WebAssembly Example

Given the following simple C file:

```c
int main() {
  return 42;
}
```

Compile the file using `emscripten`, or the online [WasmFiddle](https://wasdk.github.io/WasmFiddle//) tool. Then import and instantiate the resulting file:

```js
import wasm from './sample.wasm';

wasm({ ...imports }).then(({ instance }) => {
  console.log(instance.exports.main());
});
```

The WebAssembly is inlined as a base64 encoded string. At runtime the string is decoded and a module is returned.

_Note: The base64 string that represents the WebAssembly within the bundle will be ~33% larger than the original file._

### Synchronous Modules

Small modules (< 4KB) can be compiled synchronously by specifying them in the configuration.

```js
wasm({
  sync: ['web/sample.wasm', 'web/foobar.wasm']
});
```

This means that the exports can be accessed immediately.

```js
import module from './sample.wasm';

const instance = sample({ ...imports });

console.log(instance.exports.main());
```

## Meta

[CONTRIBUTING](/.github/CONTRIBUTING.md)

[LICENSE (MIT)](/LICENSE)
