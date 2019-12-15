[npm]: https://img.shields.io/npm/v/@rollup/plugin-multi-entry
[npm-url]: https://www.npmjs.com/package/@rollup/plugin-multi-entry
[size]: https://packagephobia.now.sh/badge?p=@rollup/plugin-multi-entry
[size-url]: https://packagephobia.now.sh/result?p=@rollup/plugin-multi-entry

[![npm][npm]][npm-url]
[![size][size]][size-url]
[![libera manifesto](https://img.shields.io/badge/libera-manifesto-lightgrey.svg)](https://liberamanifesto.com)

# @rollup/plugin-multi-entry

🍣 A Rollup plugin which allows use of multiple entry points for a bundle.

As an added bonus, the _named exports_ from all entry points will be combined. This is particularly useful for tests, but can also be used to package a library.

_Note: `default` exports cannot be combined and exported by this plugin. Only named exports will be exported._

## Requirements

This plugin requires an [LTS](https://github.com/nodejs/Release) Node version (v8.0.0+) and Rollup v1.20.0+.

## Install

Using npm:

```console
npm install @rollup/plugin-multi-entry --save-dev
```

## Usage

Suppose that we have three separate source files, each with their own export(s):

```js
// batman.js
export const belt = 'utility';
```

```js
// robin.js
export const tights = 'tight';
```

```js
// joker.js
export const color = 'purple';
```

Then, create a `rollup.config.js` [configuration file](https://www.rollupjs.org/guide/en/#configuration-files) and import the plugin:

```js
import multi from '@rollup/plugin-multi-entry';

export default {
  input: ['batman.js', 'robin.js', 'joker.js'],
  output: {
    dir: 'output'
  },
  plugins: [multi()]
};
```

Then call `rollup` either via the [CLI](https://www.rollupjs.org/guide/en/#command-line-reference) or the [API](https://www.rollupjs.org/guide/en/#javascript-api).

Using all three files above as entry points will yield a bundle with exports for `belt`, `tights`, and `color`.

## Options

### `exports`

Type: `Boolean`<br>
Default: `true`

If `true`, instructs the plugin to export named exports to the bundle from all entries. If `false`, the plugin will not export any entry exports to the bundle. This can be useful when wanting to combine code from multiple entry files, but not necessarily to export each entry file's exports.

## Supported Input Types

This plugin extends Rollup's `input` option to support multiple new value types, in addition to a `String` specifying a path to a file.

### Glob

When using `plugin-multi-entry`, input values passed as a normal `String` are [glob aware](<https://en.wikipedia.org/wiki/Glob_(programming)>). Meaning you can utilize glob wildcards and other glob patterns to specify files as being input files.

```js
export default {
  input: 'batcave/friends/**/*.js',
  plugins: [multi()]
  // ...
};
```

### Array

An `Array` of `String` can be passed as the input. Values are glob-aware and can specify paths or globbed paths.

```js
export default {
  input: ['party/supplies.js', 'batcave/friends/**/*.js'],
  plugins: [multi()]
  // ...
};
```

### `include` and `exclude`

For fine-grain control, an `Object` may be passed containing `include` and `exclude` properties. These properties specify and `Array` of `String` representing paths (which are also glob-aware) which should be included as entry files, as well as files that should be excluded from any entries that may have been found with `include`, respectively.

```js
export default {
  input: {
    // invite everyone!
    include: ['food.js', 'drinks.js', 'batcave/friends/**/*.js'],
    // except for the joker
    exclude: ['**/joker.js']
  },
  plugins: [multi()]
  // ...
};
```

## Meta

[CONTRIBUTING](/.github/CONTRIBUTING.md)

[LICENSE (MIT)](/LICENSE)
