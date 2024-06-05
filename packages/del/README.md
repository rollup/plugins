[npm]: https://img.shields.io/npm/v/@rollup/plugin-del
[npm-url]: https://www.npmjs.com/package/@rollup/plugin-del
[size]: https://packagephobia.now.sh/badge?p=@rollup/plugin-del
[size-url]: https://packagephobia.now.sh/result?p=@rollup/plugin-del

[![npm][npm]][npm-url]
[![size][size]][size-url]
[![libera manifesto](https://img.shields.io/badge/libera-manifesto-lightgrey.svg)](https://liberamanifesto.com)

# @rollup/plugin-del

Delete files and folders using Rollup.

## About

This plugin is useful when you want to clean `dist` or other folders and files before bundling. It's using [del package](https://github.com/sindresorhus/del) inside, check it for pattern examples.

## Installation

```bash
# yarn
yarn add @rollup/plugin-del -D

# npm
npm install @rollup/plugin-del -D
```

## Usage

```js
// rollup.config.js
import del from '@rollup/plugin-del';

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/app.js',
    format: 'cjs'
  },
  plugins: [del({ targets: 'dist/*' })]
};
```

### Configuration

There are some useful options:

#### targets

A string or an array of patterns of files and folders to be deleted. Default is `[]`.

```js
del({
  targets: 'dist/*'
});

del({
  targets: ['dist/*', 'build/*']
});
```

#### verbose

Output removed files and folders to console. Default is `false`.

```js
del({
  targets: 'dist/*',
  verbose: true
});
```

> Note: use \* (wildcard character) in pattern to show removed files

#### hook

[Rollup hook](https://rollupjs.org/guide/en/#build-hooks) the plugin should use. Default is `buildStart`.

```js
del({
  targets: 'dist/*',
  hook: 'buildEnd'
});
```

#### runOnce

Type: `boolean` | Default: `false`

Delete items once. Useful in watch mode.

```js
del({
  targets: 'dist/*',
  runOnce: true
});
```

All other options are passed to [del package](https://github.com/sindresorhus/del) which is used inside.

## License

MIT
