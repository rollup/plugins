# rollup-plugin-babel

Seamless integration between Rollup and Babel.

## Why?

If you're using Babel to transpile your ES6/7 code and Rollup to generate a standalone bundle, you have a couple of options:

* run the code through Babel first, being careful to disable the `es6.modules` transformer, or
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
      exclude: 'node_modules/**',
      sourceMap: true
    })
  ]
}).then(...)
```

All options are as per the [Babel documentation](https://babeljs.io/), except `options.include` and `options.exclude` (each a minimatch pattern, or array of minimatch patterns), which determine which files are transpiled by Babel (by default, all files are transpiled).

Babel will respect `.babelrc` files – this is generally the best place to put your configuration.


## License

MIT
