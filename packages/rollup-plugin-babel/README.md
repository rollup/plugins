# rollup-plugin-babel

Seamless integration between Rollup and Babel.

## Why?

If you're using Babel to transpile your ES6/7 code and Rollup to generate a standalone bundle, you have a couple of options:

* run the code through Babel first, being careful to exclude the module transformer, or
* run the code through Rollup first, and *then* pass it to Babel.

Both approaches have disadvantages – in the first case, on top of the additional configuration complexity, you may end up with Babel's helpers (like `classCallCheck`) repeated throughout your code (once for each module where the helpers are used). In the second case, transpiling is likely to be slower, because transpiling a large bundle is much more work for Babel than transpiling a set of small files.

Either way, you have to worry about a place to put the intermediate files, and getting sourcemaps to behave becomes a royal pain.

Using Rollup with rollup-plugin-babel makes the process far easier.


## Installation

```bash
npm install --save-dev rollup-plugin-babel
```


## Usage

```js
import { rollup } from 'rollup';
import babel from 'rollup-plugin-babel';

rollup({
  entry: 'main.js',
  plugins: [
    babel({
      exclude: 'node_modules/**'
    })
  ]
}).then(...)
```

All options are as per the [Babel documentation](https://babeljs.io/), except `options.include` and `options.exclude` (each a minimatch pattern, or array of minimatch patterns), which determine which files are transpiled by Babel (by default, all files are transpiled).

Babel will respect `.babelrc` files – this is generally the best place to put your configuration.


## Babel 5

The latest version of rollup-plugin-babel is designed to work with Babel 6. To use rollup-plugin-babel with Babel 5, install a 1.x version:

```bash
npm install --save-dev rollup-plugin-babel@1
```


## Babel 6

With Babel 5, rollup-plugin-babel overrides the configuration to ensure that module syntax is left alone and that external helpers are collected for inclusion at the top of the bundle.

Babel 6 works differently – there's no `blacklist` or `externalHelpers` options. Instead of using the `es2015` preset, install and use [babel-preset-es2015-rollup](https://github.com/rollup/babel-preset-es2015-rollup):

```js
// .babelrc
{
  "presets": [ "es2015-rollup" ]
}
```

If you're not using the preset, be sure to include the external helpers plugin:

```js
// .babelrc
{
  "plugins": [ "external-helpers-2" ]
}
```


## License

MIT
