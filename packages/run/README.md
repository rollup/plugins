# @rollup/plugin-run

🍣 A Rollup plugin which runs your bundles in Node once they're built.

Using this plugin gives much faster results compared to what you would do with [nodemon](https://nodemon.io/).

## Install

Using npm:

```console
npm i -D @rollup/plugin-run
```

## Usage

Create a `rollup.config.js` [configuration file](https://www.rollupjs.org/guide/en/#configuration-files) and import the plugin:

```js
// rollup.config.js
import run from "@rollup/plugin-run";

export default {
  input: "src/index.js",
  output: {
    file: "dist/index.js",
    format: "cjs"
  },
  plugins: [run()]
};
```

The app is run in a child process using [child_process.fork(...)](https://nodejs.org/api/child_process.html#child_process_child_process_fork_modulepath_args_options). Each time your bundle is rebuilt when the source code changes, this plugin starts the generated file as a child process (after first closing the previous process, if it's not the first run).

Since this feature is intended for development use, you may prefer to only include it when Rollup is being run in watch mode:

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

> NOTE: It works with Rollup's code-splitting if you're using dynamic `import(...)` — the only constraint is that you have a single entry point specified in the config.

## Options

You can pass through options such as `env` and `execArgv`. For example, to debug with sourcemaps using [source-map-support](https://www.npmjs.com/package/source-map-support) you could do this:

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
