[npm]: https://img.shields.io/npm/v/@rollup/plugin-run
[npm-url]: https://www.npmjs.com/package/@rollup/plugin-run
[size]: https://packagephobia.now.sh/badge?p=@rollup/plugin-run
[size-url]: https://packagephobia.now.sh/result?p=@rollup/plugin-run

[![npm][npm]][npm-url]
[![size][size]][size-url]
[![libera manifesto](https://img.shields.io/badge/libera-manifesto-lightgrey.svg)](https://liberamanifesto.com)

# @rollup/plugin-run

🍣 A Rollup plugin which runs your bundles in Node once they're built.

Using this plugin gives much faster results compared to what you would do with [nodemon](https://nodemon.io/).

## Install

Using npm:

```console
npm install @rollup/plugin-run --save-dev
```

## Usage

Create a `rollup.config.js` [configuration file](https://www.rollupjs.org/guide/en/#configuration-files) and import the plugin:

```js
import run from '@rollup/plugin-run';

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/index.js',
    format: 'cjs'
  },
  plugins: [run()]
};
```

Then call `rollup` either via the [CLI](https://www.rollupjs.org/guide/en/#command-line-reference) or the [API](https://www.rollupjs.org/guide/en/#javascript-api). If the build produces any errors, the plugin will write a 'alias' character to stderr, which should be audible on most systems.

The plugin `forks` a child process with the generated file, every time the bundle is rebuilt (after first closing the previous process, if it's not the first run).

_Note: This plugin works with Rollup's code-splitting if you're using dynamic `import(...)` — the only constraint is that you have a single entry point specified in the config._

## Options

This plugin supports pass through option available for [child_process.fork(...)](https://nodejs.org/api/child_process.html#child_process_child_process_fork_modulepath_args_options).

Example:

Debugging with sourcemaps using [source-map-support](https://www.npmjs.com/package/source-map-support):

```diff
// rollup.config.js
import run from '@rollup/plugin-run';

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/index.js',
    format: 'cjs',
+    sourcemap: true
  },
  plugins: [
-    run()
+    run({
+      execArgv: ['-r', 'source-map-support/register']
+    })
  ]
};
```

### `allowRestarts`

Type: `Boolean`<br>
Default: `false`

If `true`, instructs the plugin to listen to `stdin` for the sequences listed below followed by enter (carriage return).

#### `stdin` Input Actions

When this option is enabled, `stdin` will listen for the following input and perform the associated action:

- `restart` → Kills the currently running bundle and starts it again. _Note: This does not create a new bundle, the bundle is run again "as-is". This can be used to test configuration changes or other changes that are made without modifying your source_
  Also allowed: `rs`, `CTRL+K`

- `clear` → Clears the screen of all text
  Also allowed: `cls`, `CTRL+L`

## Practical Example

The feature is usually intended for development use, you may prefer to only include it when Rollup is being run in watch mode:

```diff
// rollup.config.js
import run from '@rollup/plugin-run';

+const dev = process.env.ROLLUP_WATCH === 'true';

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/index.js',
    format: 'cjs'
  },
  plugins: [
-    run()
+    dev && run()
  ]
};
```

## Meta

[CONTRIBUTING](/.github/CONTRIBUTING.md)

[LICENSE (MIT)](/LICENSE)
