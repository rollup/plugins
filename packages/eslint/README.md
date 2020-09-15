# rollup-plugin-eslint [![Travis Build Status][travis-img]][travis]

[travis-img]: https://travis-ci.org/TrySound/rollup-plugin-eslint.svg
[travis]: https://travis-ci.org/TrySound/rollup-plugin-eslint
[rollup]: https://github.com/rollup/rollup
[eslint-config]: http://eslint.org/docs/developer-guide/nodejs-api#cliengine

[Rollup] plugin to verify entry point and all imported files with ESLint.

## Install

```sh
yarn add rollup-plugin-eslint --dev
```

## Usage

```js
import { rollup } from "rollup";
import { eslint } from "rollup-plugin-eslint";

export default {
  input: "main.js",
  plugins: [
    eslint({
      /* your options */
    })
  ]
};
```

## Options

See more options here [eslint-config].

You can also use eslint configuration in the form of a `.eslintrc.*` file in your project's root. It will be loaded automatically.

### fix

Type: `boolean`  
Default: `false`

If true, will auto fix source code.

### throwOnError

Type: `boolean`  
Default: `false`

If true, will throw an error if any errors were found.

### throwOnWarning

Type: `boolean`  
Default: `false`

If true, will throw an error if any warnings were found.

### include

Type: `array` or `string`  
Default: `[]`

A single file, or array of files, to include when linting.

### exclude

Type: `array` or `string`  
Default: `node_modules/**`

A single file, or array of files, to exclude when linting.

### formatter

Type: `function` or `string`  
Default: `stylish`

Custom error formatter or the name of a built-in formatter.

# License

MIT © [Bogdan Chadkin](mailto:trysound@yandex.ru)
