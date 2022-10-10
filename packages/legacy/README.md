[npm]: https://img.shields.io/npm/v/@rollup/plugin-legacy
[npm-url]: https://www.npmjs.com/package/@rollup/plugin-legacy
[size]: https://packagephobia.now.sh/badge?p=@rollup/plugin-legacy
[size-url]: https://packagephobia.now.sh/result?p=@rollup/plugin-legacy

[![npm][npm]][npm-url]
[![size][size]][size-url]
[![libera manifesto](https://img.shields.io/badge/libera-manifesto-lightgrey.svg)](https://liberamanifesto.com)

# @rollup/plugin-legacy

🍣 A Rollup plugin which adds `export` declarations to legacy non-module scripts.

## Requirements

This plugin requires an [LTS](https://github.com/nodejs/Release) Node version (v14.0.0+) and Rollup v1.20.0+.

## Install

Using npm:

```console
npm install @rollup/plugin-legacy --save-dev
```

## Usage

Create a `rollup.config.js` [configuration file](https://www.rollupjs.org/guide/en/#configuration-files) and import the plugin:

```js
import legacy from '@rollup/plugin-legacy';

export default {
  entry: 'src/main.js',
  output: {
    dir: 'output',
    format: 'cjs'
  },
  plugins: [legacy({ 'vendor/some-library.js': 'someLibrary' })]
};
```

Then call `rollup` either via the [CLI](https://www.rollupjs.org/guide/en/#command-line-reference) or the [API](https://www.rollupjs.org/guide/en/#javascript-api).

## Options

Type: `Object`<br>
Default: `null`

Specifies an `Object` which defines exports used when importing corresponding scripts. The `Object` allows specifying script paths as a key, and the corresponding value as the `export`s for that script. For example:

#### `Object` Format

The `Object` format allows specifying aliases as a key, and the corresponding value as the actual `import` value. For example:

```js
legacy({
  'vendor/some-library.js': 'someLibrary',

  'vendor/another-library.js': {
    foo: 'anotherLib.foo',
    bar: 'anotherLib.bar',
    baz: 'anotherLib.baz'
  }
});
```

The configuration above will create a default export when importing `'vendor/some-library.js'` that corresponds with the `someLibrary` variable that it creates. It will also create named exports when importing `'vendor/another-library.js'`.

## Motivation

Occasionally you'll find a useful snippet of code from the Old Days, before newfangled technology like npm. These scripts will typically expose themselves as `var someLibrary = ...` or `window.someLibrary = ...`, the expectation being that other scripts will grab a reference to the library from the global namespace.

It's usually easy enough to convert these to modules. But why bother? You can just add the `legacy` plugin, configure it accordingly, and it will be turned into a module automatically. With the example config below, the following code...

```js
// vendor/some-library.js
var someLibrary = {
  square: function (n) {
    return n * n;
  },
  cube: function (n) {
    return n * n * n;
  }
};
```

...will have a default export appended to it, allowing other modules to access it:

```js
export default someLibrary;
```

It can also handle named exports. Using the same config, this...

```js
// vendor/another-library.js
var anotherLibrary = {
  foo: ...,
  bar: ...,
  baz: ...
};
```

...will get the following appended:

```js
var __export0 = anotherLibrary.foo;
export { __export0 as foo };
var __export0 = anotherLibrary.bar;
export { __export0 as bar };
var __export0 = anotherLibrary.baz;
export { __export0 as baz };
```

## Meta

[CONTRIBUTING](/.github/CONTRIBUTING.md)

[LICENSE (MIT)](/LICENSE)
