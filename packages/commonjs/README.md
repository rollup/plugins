[npm]: https://img.shields.io/npm/v/@rollup/plugin-commonjs
[npm-url]: https://www.npmjs.com/package/@rollup/plugin-commonjs
[size]: https://packagephobia.now.sh/badge?p=@rollup/plugin-commonjs
[size-url]: https://packagephobia.now.sh/result?p=@rollup/plugin-commonjs

[![npm][npm]][npm-url]
[![size][size]][size-url]
[![libera manifesto](https://img.shields.io/badge/libera-manifesto-lightgrey.svg)](https://liberamanifesto.com)

# @rollup/plugin-commonjs

🍣 A Rollup plugin to convert CommonJS modules to ES6, so they can be included in a Rollup bundle

## Requirements

This plugin requires an [LTS](https://github.com/nodejs/Release) Node version (v8.0.0+) and Rollup v1.20.0+.

## Install

Using npm:

```bash
npm install @rollup/plugin-commonjs --save-dev
```

## Usage

Create a `rollup.config.js` [configuration file](https://www.rollupjs.org/guide/en/#configuration-files) and import the plugin:

```js
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'src/index.js',
  output: {
    dir: 'output',
    format: 'cjs',
  },
  plugins: [commonjs()],
};
```

Then call `rollup` either via the [CLI](https://www.rollupjs.org/guide/en/#command-line-reference) or the [API](https://www.rollupjs.org/guide/en/#javascript-api).

## Options

### `dynamicRequireTargets`

Type: `string | string[]`<br>
Default: `[]`

Some modules contain dynamic `require` calls, or require modules that contain circular dependencies, which are not handled well by static imports.
Including those modules as `dynamicRequireTargets` will simulate a CommonJS (NodeJS-like) environment for them with support for dynamic and circular dependencies.

_Note: In extreme cases, this feature may result in some paths being rendered as absolute in the final bundle. The plugin tries to avoid exposing paths from the local machine, but if you are `dynamicRequirePaths` with paths that are far away from your project's folder, that may require replacing strings like `"/Users/John/Desktop/foo-project/"` -> `"/"`._

Example:

```js
commonjs({
  dynamicRequireTargets: [
    // include using a glob pattern (either a string or an array of strings)
    'node_modules/logform/*.js',

    // exclude files that are known to not be required dynamically, this allows for better optimizations
    '!node_modules/logform/index.js',
    '!node_modules/logform/format.js',
    '!node_modules/logform/levels.js',
    '!node_modules/logform/browser.js',
  ],
});
```

### `exclude`

Type: `string | string[]`<br>
Default: `null`

A [minimatch pattern](https://github.com/isaacs/minimatch), or array of patterns, which specifies the files in the build the plugin should _ignore_. By default non-CommonJS modules are ignored.

### `include`

Type: `string | string[]`<br>
Default: `null`

A [minimatch pattern](https://github.com/isaacs/minimatch), or array of patterns, which specifies the files in the build the plugin should operate on. By default CommonJS modules are targeted.

### `extensions`

Type: `string[]`<br>
Default: `['.js']`

Search for extensions other than .js in the order specified.

### `ignoreGlobal`

Type: `boolean`<br>
Default: `false`

If true, uses of `global` won't be dealt with by this plugin.

### `sourceMap`

Type: `boolean`<br>
Default: `true`

If false, skips source map generation for CommonJS modules.

### `transformMixedEsModules`

Type: `boolean`<br>
Default: `false`

Instructs the plugin whether or not to enable mixed module transformations. This is useful in scenarios with mixed ES and CommonJS modules. Set to `true` if it's known that `require` calls should be transformed, or `false` if the code contains env detection and the `require` should survive a transformation.

### `ignore`

Type: `string[] | ((id: string) => boolean)`<br>
Default: `[]`

Sometimes you have to leave require statements unconverted. Pass an array containing the IDs or an `id => boolean` function. Only use this option if you know what you're doing!

### `esmExternals`

Type: `boolean | string[] || ((id: string) => boolean)`
Default: `false`

Controls how imports from external dependencies are rendered. By default, all external dependencies are assumed to be CommonJS. This means they are rendered as default imports to be compatible with e.g. NodeJS where ES modules can only import a default export from a CommonJS dependency:

```js
// input
const foo = require('foo');

// output
import foo from 'foo';
```

This is likely not desired for ES module dependencies: Here `require` should usually return the namespace to be compatible with how bundled modules are handled.

If you set `esmExternals` to `true`, all external dependencies are assumed to be ES modules and will adhere to the `requireReturnsDefault` option. If that option is not set, they will be rendered as namespace imports.

You can also supply an array of ids that are to be treated as ES modules, or a function that will be passed each external id to determine if it is an ES module.

### `requireReturnsDefault`

Type: `boolean | "auto" | "preferred" | ((id: string) => boolean | "auto" | "preferred")`<br>
Default: `false`

Controls what is returned when requiring an ES module or external dependency from a CommonJS file. By default, this plugin will render it as a namespace import, i.e.

```js
// input
const foo = require('foo');

// output
import * as foo from 'foo';
```

This is in line with how other bundlers handle this situation and is also the most likely behaviour in case Node should ever support this. However there are some situations where this may not be desired:

- There is code in an external dependency that cannot be changed where a `require` statement expects the default export to be returned from an ES module.
- If the imported module is in the same bundle, Rollup will generate a namespace object for the imported module which can increase bundle size unnecessarily:

  ```js
  // input: main.js
  const dep = require('./dep.js');
  console.log(dep.default);

  // input: dep.js
  export default 'foo';

  // output
  var dep = 'foo';

  var dep$1 = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    default: dep,
  });

  console.log(dep$1.default);
  ```

For these situations, you can change Rollup's behaviour either globally or per module. To change it globally, set the `requireReturnsDefault` option to one of the following values:

- `false`: This is the default, requiring an ES module returns its namespace. For external dependencies when using `esmExternals: true`, no additional interop code is generated:

  ```js
  // input
  const dep = require('dep');
  console.log(dep);

  // output
  import * as dep from 'dep';

  console.log(dep);
  ```

- `"auto"`: This is complementary to how [`output.exports`](https://rollupjs.org/guide/en/#outputexports): `"auto"` works in Rollup: If a module has a default export and no named exports, requiring that module returns the default export. In all other cases, the namespace is returned. For external dependencies when using `esmExternals: true`, a corresponding interop helper is added:

  ```js
  // output
  import * as dep$1 from 'dep';

  function getDefaultExportFromNamespaceIfNotNamed(n) {
    return n &&
      Object.prototype.hasOwnProperty.call(n, 'default') &&
      Object.keys(n).length === 1
      ? n['default']
      : n;
  }

  var dep = getDefaultExportFromNamespaceIfNotNamed(dep$1);

  console.log(dep);
  ```

- `"preferred"`: If a module has a default export, requiring that module always returns the default export, no matter whether additional named exports exist. This is similar to how previous versions of this plugin worked. Again for external dependencies when using `esmExternals: true`, an interop helper is added:

  ```js
  // output
  import * as dep$1 from 'dep';

  function getDefaultExportFromNamespaceIfPresent(n) {
    return n && Object.prototype.hasOwnProperty.call(n, 'default')
      ? n['default']
      : n;
  }

  var dep = getDefaultExportFromNamespaceIfPresent(dep$1);

  console.log(dep);
  ```

- `true`: This will always try to return the default export on require without checking if it actually exists. This can throw at build time if there is no default export. This is how external dependencies are handled when `esmExternals` is not used. The advantage over the other options is that, like `false`, this does not add an interop helper for external dependencies, keeping the code lean:

  ```js
  // output
  import dep from 'dep';

  console.log(dep);
  ```

To change this for individual modules, you can supply a function for `requireReturnsDefault` instead. This function will then be called once for each required ES module or external dependency with the corresponding id and allows you to return different values for different modules.

## Using with @rollup/plugin-node-resolve

Since most CommonJS packages you are importing are probably dependencies in `node_modules`, you may need to use [@rollup/plugin-node-resolve](https://github.com/rollup/plugins/tree/master/packages/node-resolve):

```js
// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'main.js',
  output: {
    file: 'bundle.js',
    format: 'iife',
    name: 'MyModule',
  },
  plugins: [resolve(), commonjs()],
};
```

## Usage with symlinks

Symlinks are common in monorepos and are also created by the `npm link` command. Rollup with `@rollup/plugin-node-resolve` resolves modules to their real paths by default. So `include` and `exclude` paths should handle real paths rather than symlinked paths (e.g. `../common/node_modules/**` instead of `node_modules/**`). You may also use a regular expression for `include` that works regardless of base path. Try this:

```js
commonjs({
  include: /node_modules/,
});
```

Whether symlinked module paths are [realpathed](http://man7.org/linux/man-pages/man3/realpath.3.html) or preserved depends on Rollup's `preserveSymlinks` setting, which is false by default, matching Node.js' default behavior. Setting `preserveSymlinks` to true in your Rollup config will cause `import` and `export` to match based on symlinked paths instead.

## Strict mode

ES modules are _always_ parsed in strict mode. That means that certain non-strict constructs (like octal literals) will be treated as syntax errors when Rollup parses modules that use them. Some older CommonJS modules depend on those constructs, and if you depend on them your bundle will blow up. There's basically nothing we can do about that.

Luckily, there is absolutely no good reason _not_ to use strict mode for everything — so the solution to this problem is to lobby the authors of those modules to update them.

## Meta

[CONTRIBUTING](/.github/CONTRIBUTING.md)

[LICENSE (MIT)](/LICENSE)
