[npm]: https://img.shields.io/npm/v/@rollup/plugin-eslint
[npm-url]: https://www.npmjs.com/package/@rollup/plugin-eslint
[size]: https://packagephobia.now.sh/badge?p=@rollup/plugin-eslint
[size-url]: https://packagephobia.now.sh/result?p=@rollup/plugin-eslint

[![npm][npm]][npm-url]
[![size][size]][size-url]
[![libera manifesto](https://img.shields.io/badge/libera-manifesto-lightgrey.svg)](https://liberamanifesto.com)

# @rollup/plugin-eslint

🍣 A Rollup plugin to lint your source files with ESLint.

## Install

```console
# using npm
npm install @rollup/plugin-eslint --save-dev

# using yarn
yarn add @rollup/plugin-eslint --dev
```

## Usage

```js
import eslint from '@rollup/plugin-eslint';

export default {
  input: 'main.js',
  plugins: [
    eslint({
      /* your options */
    }),
  ],
};
```

## Options

This plugin respects your [ESLint configuration](https://eslint.org/docs/user-guide/configuring) as per default. It also takes a configuration object intended for the [ESLint constructor](https://eslint.org/docs/developer-guide/nodejs-api#-new-eslintoptions) with the addition of a `throwOnWarning`, `throwOnError`, `formatter`, `include` and `exclude` prop. The most popular configuration options are as follows:

### `fix`

Type: `boolean`<br>
Default: `false`<br>
Utilized by: [ESLint constructor](https://eslint.org/docs/developer-guide/nodejs-api#-new-eslintoptions)

Controls whether to enable or disable the autofix feature of ESLint.

### `extensions`

Type: `string[]`<br>
Default: `null`<br>
Utilized by: [ESLint constructor](https://eslint.org/docs/developer-guide/nodejs-api#-new-eslintoptions)

Controls what type of files ESLint should look at. The default of `null` is equal to `[ '.js' ]`.

### `throwOnWarning`

Type: `boolean`<br>
Default: `false`<br>
Utilized by: [The plugin itself](https://github.com/robinloeffel/rollup-plugin-eslint/blob/master/src/index.js#L34)

Controls whether or not to throw an error and exit the process when ESLint reports any warnings.

### `throwOnError`

Type: `boolean`<br>
Default: `false`<br>
Utilized by: [The plugin itself](https://github.com/robinloeffel/rollup-plugin-eslint/blob/master/src/index.js#L38)

Controls whether or not to throw an error and exit the process when ESLint reports any errors.

### `formatter`

Type: `string`<br>
Default: `'stylish'`<br>
Utilized by: [The plugin itself](https://github.com/robinloeffel/rollup-plugin-eslint/blob/master/src/index.js#L38)

The name of a (built-in) formatter or the path to a custom formatter.

### `include`

Type: `string | string[]`<br>
Default: `undefined`<br>
Utilized by: [`@rollup/pluginutils`](https://github.com/rollup/plugins/tree/master/packages/pluginutils#createfilter)

A single [`picomatch`](https://github.com/micromatch/picomatch) pattern or an array of patterns controlling which files this plugin should explicitly include. Gets forwarded to the [`createFilter`](https://github.com/rollup/plugins/tree/master/packages/pluginutils#createfilter) method of `@rollup/pluginutils`.

### `exclude`

Type: `string | string[]`<br>
Default: `'node_modules/**'`<br>
Utilized by: [`@rollup/pluginutils`](https://github.com/rollup/plugins/tree/master/packages/pluginutils#createfilter)

A single [`picomatch`](https://github.com/micromatch/picomatch) pattern or an array of patterns controlling which files this plugin should explicitly exclude. Gets forwarded to the [`createFilter`](https://github.com/rollup/plugins/tree/master/packages/pluginutils#createfilter) method of `@rollup/pluginutils`.

## Meta

[CONTRIBUTING](/.github/CONTRIBUTING.md)

[LICENSE (MIT)](/LICENSE)
