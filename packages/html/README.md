[npm]: https://img.shields.io/npm/v/@rollup/plugin-html
[npm-url]: https://www.npmjs.com/package/@rollup/plugin-html
[size]: https://packagephobia.now.sh/badge?p=@rollup/plugin-html
[size-url]: https://packagephobia.now.sh/result?p=@rollup/plugin-html

[![npm][npm]][npm-url]
[![size][size]][size-url]
[![libera manifesto](https://img.shields.io/badge/libera-manifesto-lightgrey.svg)](https://liberamanifesto.com)

# @rollup/plugin-html

🍣 A Rollup plugin which creates HTML files to serve Rollup bundles

## Requirements

This plugin requires an [LTS](https://github.com/nodejs/Release) Node version (v8.0.0+) and Rollup v1.20.0+.

## Install

Using npm:

```console
npm install @rollup/plugin-html --save-dev
```

## Usage

Create a `rollup.config.js` [configuration file](https://www.rollupjs.org/guide/en/#configuration-files) and import the plugin:

```js
const html = require('@rollup/plugin-html');

module.exports = {
  input: 'src/index.js',
  output: {
    dir: 'output',
    format: 'cjs'
  },
  plugins: [html()]
};
```

Then call `rollup` either via the [CLI](https://www.rollupjs.org/guide/en/#command-line-reference) or the [API](https://www.rollupjs.org/guide/en/#javascript-api).

Once run successfully, an HTML file should be written to the bundle output destination.

## Options

### `attributes`

Type: `Object`<br>
Default: `{ html: { lang: 'en' }, link: null, script: null }`

Specifies additional attributes for `html`, `link`, and `script` elements. For each property, provide an object with key-value pairs that represent an HTML element attribute name and value. By default, the `html` element is rendered with an attribute of `lang="en"`.

### `fileName`

Type: `String`<br>
Default: `'index.html'`

Specifies the name of the HTML to emit.

### `publicPath`

Type: `String`<br>
Default: `''`

Specifies a path to prepend to all bundle assets (files) in the HTML output.

### `template`

Type: `Fumction`<br>
Default: `internal function`
Returns: `String`

Specifies a function that provides the rendered source for the HTML output. The function should be in the form of:

```js
const template = ({ attributes, files, publicPath, title }) => { ... }
```

- `attributes`: corresponds to the `attributes` option passed to the plugin
- `files`: An `Array` of `String` containing the assets (files) in the bundle that will be emitted
- `publicPath`: corresponds to the `publicPath` option passed to the plugin
- `title`: corresponds to the `title` option passed to the plugin

By default this is handled internally and produces HTML in the following format:

```html
<!DOCTYPE html>
<html ${attributes}>
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    ${links}
  </head>
  <body>
    ${scripts}
  </body>
</html>
```

Where `${links}` represents all `<link ..` tags for CSS and `${scripts}` represents all `<script...` tags for JavaScript files.

### `title`

Type: `String`<br>
Default: `'Rollup Bundle'`

Specifies the HTML document title.

## Exports

### `makeHtmlAttributes(attributes)`

Parameters: `attributes`, Type: `Object`<br>
Returns: `String`

Consumes an object with key-value pairs that represent an HTML element attribute name and value. The function returns all pairs as a space-separated string of valid HTML element attributes. e.g.

```js
const { makeHtmlAttributes } = require('@rollup/plugin-html');

makeHtmlAttributes({ lang: 'en', 'data-batcave': 'secret' });
// -> 'lang="en" data-batcave="secret"'
```

## Meta

[CONTRIBUTING](/.github/CONTRIBUTING.md)

[LICENSE (MIT)](/LICENSE)
