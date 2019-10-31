# @rollup/plugin-butternut

🍣 A Rollup plugin which compresses JavaScript with [Butternut](https://github.com/Rich-Harris/butternut).


## Installation

```console
npm install @rollup/plugin-butternut --save-dev
```

## Usage

```js
// rollup.config.js
import butternut from '@rollup/plugin-butternut';

export default {
  input: 'src/index.js',
  output: {
    dir: 'output',
    format: 'cjs'
  },
  plugins: [butternut()]
};
```

## Options
This plugin currently has no available options.

## Meta

[CONTRIBUTING](/.github/CONTRIBUTING.md)

[LICENSE (MIT)](/LICENSE)