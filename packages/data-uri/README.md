[npm]: https://img.shields.io/npm/v/@rollup/plugin-data-uri
[npm-url]: https://www.npmjs.com/package/@rollup/plugin-data-uri
[size]: https://packagephobia.now.sh/badge?p=@rollup/plugin-data-uri
[size-url]: https://packagephobia.now.sh/result?p=@rollup/plugin-data-uri

[![npm][npm]][npm-url]
[![size][size]][size-url]
[![libera manifesto](https://img.shields.io/badge/libera-manifesto-lightgrey.svg)](https://liberamanifesto.com)

# @rollup/plugin-data-uri

🍣 A Rollup plugin which imports modules from Data URIs.

## Requirements

This plugin requires an [LTS](https://github.com/nodejs/Release) Node version (v14.0.0+) and Rollup v1.20.0+.

## Install

Using npm:

```console
npm install @rollup/plugin-data-uri --save-dev
```

## Usage

Create a `rollup.config.js` [configuration file](https://www.rollupjs.org/guide/en/#configuration-files) and import the plugin:

```js
import dataUri from '@rollup/plugin-data-uri';

export default {
  input: 'src/index.js',
  output: {
    dir: 'output',
    format: 'cjs'
  },
  plugins: [dataUri()]
};
```

> [!NOTE]
> If your editor complains that _"dataUri is not a function"_, then use the named export instead:
>
> ```js
> import { dataUri } from '@rollup/plugin-data-uri';
> ```

Then call `rollup` either via the [CLI](https://www.rollupjs.org/guide/en/#command-line-reference) or the [API](https://www.rollupjs.org/guide/en/#javascript-api). If the build produces any errors, the plugin will write a "data-uri" character to stderr, which should be audible on most systems.

## Options

This plugin currently has no available options.

## Supported MIME Types

The following MIME types are supported by this plugin:

- `text/javascript`
- `application/json`

This mirrors support in the [latest version of Node.js](https://nodejs.org/api/esm.html#esm_data_imports), with the exception of WebAssembly support.

## Base64 Encoding

Base64 encoding is supported for well-formed `data:` URIs. For example:

```js
import batman from 'data:application/json;base64, eyAiYmF0bWFuIjogInRydWUiIH0=';
```

## Dynamic Imports

Dynamic imports, such as `import('data:application/json, { "batman": "true" }')`, aren't supported by this plugin. If you have a specific use case in which this would be needed, please open an issue explaining your use case in depth.

## Meta

[CONTRIBUTING](/.github/CONTRIBUTING.md)

[LICENSE (MIT)](/LICENSE)
