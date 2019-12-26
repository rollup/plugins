[npm]: https://img.shields.io/npm/v/@rollup/plugin-sucrase
[npm-url]: https://www.npmjs.com/package/@rollup/plugin-sucrase
[size]: https://packagephobia.now.sh/badge?p=@rollup/plugin-sucrase
[size-url]: https://packagephobia.now.sh/result?p=@rollup/plugin-sucrase

[![npm][npm]][npm-url]
[![size][size]][size-url]
[![libera manifesto](https://img.shields.io/badge/libera-manifesto-lightgrey.svg)](https://liberamanifesto.com)

# @rollup/plugin-sucrase

🍣 A Rollup plugin which compiles TypeScript, Flow, JSX, etc with Sucrase.

## Requirements

This plugin requires an [LTS](https://github.com/nodejs/Release) Node version (v8.0.0+) and Rollup v1.20.0+.

## Install

Using npm:

```console
npm install @rollup/plugin-sucrase --save-dev
```

## Usage

Create a `rollup.config.js` [configuration file](https://www.rollupjs.org/guide/en/#configuration-files) and import the plugin. An example of compiling TypeScript (the node-resolve plugin is added to automatically add file extensions, since TypeScript expects not to find them):

```js
import sucrase from '@rollup/plugin-sucrase';
import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'src/index.ts',
  output: {
    file: 'dist/bundle.js',
    format: 'cjs'
  },
  plugins: [
    resolve({
      extensions: ['.js', '.ts']
    }),
    sucrase({
      exclude: ['node_modules/**'],
      transforms: ['typescript']
    })
  ]
};
```

Then call `rollup` either via the [CLI](https://www.rollupjs.org/guide/en/#command-line-reference) or the [API](https://www.rollupjs.org/guide/en/#javascript-api).

## Options

The following [Sucrase options](https://github.com/alangpierce/sucrase#transforms) may be passed as options for this plugin:

- `enableLegacyBabel5ModuleInterop`
- `enableLegacyTypeScriptModuleInterop`
- `jsxFragmentPragma`
- `jsxPragma`
- `production`
- `transforms`

### `exclude`

Type: `String` | `Array[...String]`
Default: `null`

A [minimatch pattern](https://github.com/isaacs/minimatch), or array of patterns, which specifies the files in the build the plugin should _ignore_. By default no files are ignored.

### `include`

Type: `String` | `Array[...String]`
Default: `null`

A [minimatch pattern](https://github.com/isaacs/minimatch), or array of patterns, which specifies the files in the build the plugin should operate on. By default all files are targeted.

## Meta

[CONTRIBUTING](/.github/CONTRIBUTING.md)

[LICENSE (MIT)](/LICENSE)
