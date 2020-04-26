[npm]: https://img.shields.io/npm/v/@rollup/plugin-html
[npm-url]: https://www.npmjs.com/package/@rollup/plugin-html
[size]: https://packagephobia.now.sh/badge?p=@rollup/plugin-html
[size-url]: https://packagephobia.now.sh/result?p=@rollup/plugin-html

[![npm][npm]][npm-url]
[![size][size]][size-url]
[![libera manifesto](https://img.shields.io/badge/libera-manifesto-lightgrey.svg)](https://liberamanifesto.com)

# @rollup/plugin-html

🍣 A Rollup plugin which creates HTML files to serve Rollup bundles.

Please see [Supported Output Formats](#supported-output-formats) for information about using this plugin with output formats other than `esm` (`es`), `iife`, and `umd`.

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

_Note: If using the `es` / `esm` output format, `{ type: 'module'}` is automatically added to `attributes.script`._

### `fileName`

Type: `String`<br>
Default: `'index.html'`

### `meta`

Type: `Array[...object]`<br>
Default: `[{ charset: 'utf-8' }]`

Specifies attributes used to create `<meta>` elements. For each array item, provide an object with key-value pairs that represent `<meta>` element attribute names and values.

Specifies the name of the HTML to emit.

### `publicPath`

Type: `String`<br>
Default: `''`

Specifies a path to prepend to all bundle assets (files) in the HTML output.

### `template`

Type: `Function`<br>
Default: `internal function`
Returns: `String`

Specifies a function that provides the rendered source for the HTML output. The function should be in the form of:

```js
const template = ({ attributes, bundle, files, publicPath, title }) => { ... }
```

- `attributes`: Corresponds to the `attributes` option passed to the plugin
- `bundle`: An `Object` containing key-value pairs of [`AssetInfo` or `ChunkInfo`](https://rollupjs.org/guide/en/#generatebundle)
- `files`: An `Array` of `AssetInfo` or `ChunkInfo` containing any entry (`isEntry: true`) files, and any asset (`isAsset: true`) files in the bundle that will be emitted
- `publicPath`: Corresponds to the `publicPath` option passed to the plugin
- `title`: Corresponds to the `title` option passed to the plugin

By default this is handled internally and produces HTML in the following format:

```html
<!DOCTYPE html>
<html ${attributes}>
  <head>
    ${metas}
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

## Supported Output Formats

By default, this plugin supports the `esm` (`es`), `iife`, and `umd` [output formats](https://rollupjs.org/guide/en/#outputformat), as those are most commonly used as browser bundles. Other formats can be used, but will require using the [`template`](#template) option to specify a custom template function which renders the unique requirements of other formats.

### `amd`

Will likely require use of RequireJS semantics, which allows only for a single entry `<script>` tag. If more entry chunks are emitted, these need to be loaded via a proxy file. RequireJS would also need to be a dependency and added to the build: https://requirejs.org/docs/start.html.

### `system`

Would require a separate `<script>` tag first that adds the `s.js` minimal loader. Loading modules might then resemble: `<script>System.import('./batman.js')</script>`.

## Attribution

This plugin was inspired by and is based upon [mini-html-webpack-plugin](https://github.com/styleguidist/mini-html-webpack-plugin) by Juho Vepsäläinen and Artem Sapegin, with permission.

## Meta

[CONTRIBUTING](/.github/CONTRIBUTING.md)

[LICENSE (MIT)](/LICENSE)
