[cover]: https://codecov.io/gh/rollup/plugins/branch/master/graph/badge.svg
[cover-url]: https://codecov.io/gh/rollup/plugins
[size]: https://packagephobia.now.sh/badge?p=@rollup/plugin-strip
[size-url]: https://packagephobia.now.sh/result?p=@rollup/plugin-strip
[tests]: https://img.shields.io/circleci/project/github/rollup/plugins.svg
[tests-url]: https://circleci.com/gh/rollup/plugins

[![tests][tests]][tests-url]
[![cover][cover]][cover-url]
[![size][size]][size-url]
[![libera manifesto](https://img.shields.io/badge/libera-manifesto-lightgrey.svg)](https://liberamanifesto.com)

# @rollup/plugin-strip

🍣 A Rollup plugin to remove `debugger` statements and functions like `assert.equal` and `console.log` from your code.

## Installation

```bash
npm install --save-dev @rollup/plugin-strip
```

## Usage

```js
// rollup.config.js
import strip from '@rollup/plugin-strip';

export default {
  input: 'src/index.js',
  output: [
    {
      format: 'cjs',
      file: 'dist/my-lib.js'
    }
  ],
  plugins: [
    strip({
      // set this to `false` if you don't want to
      // remove debugger statements
      debugger: true,

      // defaults to `[ 'console.*', 'assert.*' ]`
      functions: ['console.log', 'assert.*', 'debug', 'alert'],

      // remove one or more labeled blocks by name
      // defaults to `[]`
      labels: ['unittest'],

      // set this to `false` if you're not using sourcemaps –
      // defaults to `true`
      sourceMap: true
    })
  ]
};
```

## License

MIT
