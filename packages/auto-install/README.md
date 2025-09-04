[npm]: https://img.shields.io/npm/v/@rollup/plugin-auto-install
[npm-url]: https://www.npmjs.com/package/@rollup/plugin-auto-install
[size]: https://packagephobia.now.sh/badge?p=@rollup/plugin-auto-install
[size-url]: https://packagephobia.now.sh/result?p=@rollup/plugin-auto-install

[![npm][npm]][npm-url]
[![size][size]][size-url]
[![libera manifesto](https://img.shields.io/badge/libera-manifesto-lightgrey.svg)](https://liberamanifesto.com)

# @rollup/plugin-auto-install

🍣 A Rollup plugin which automatically installs dependencies that are imported by a bundle, even if not yet in `package.json`.

## Requirements

This plugin requires an [LTS](https://github.com/nodejs/Release) Node version (v14.0.0+) and Rollup v1.20.0+.

## Install

Using npm:

```console
npm install @rollup/plugin-auto-install --save-dev
```

## Usage

Create a `rollup.config.js` [configuration file](https://www.rollupjs.org/guide/en/#configuration-files) and import the plugin:

```js
import autoInstall from '@rollup/plugin-auto-install';
import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'src/index.js',
  output: {
    dir: 'output',
    format: 'cjs'
  },
  plugins: [autoInstall(), resolve()]
};
```

> [!NOTE]
> If your editor complains that _"autoInstall is not a function"_, then use the named export instead:
>
> ```js
> import { autoInstall } from '@rollup/plugin-auto-install';
> ```

> [!IMPORTANT]
> Ensure that this plugin is added to the `plugins` array _before_ [@rollup/plugin-node-resolve](https://github.com/rollup/plugins/tree/master/packages/node-resolve).

Then call `rollup` either via the [CLI](https://www.rollupjs.org/guide/en/#command-line-reference) or the [API](https://www.rollupjs.org/guide/en/#javascript-api).

## Options

### `pkgFile`

Type: `String`<br>
Default: `'{cwd}/package.json'`

Specifies the location on disk of the target `package.json` file. If the file doesn't exist, it will be created by the plugin, as package managers need to populate the `dependencies` property.

### `manager`

Type: `'pnpm'|'yarn'|'npm'`<br>
Default: determined at runtime

Specifies the package manager to use. If not specified:

- `'pnpm'` if `pnpm-lock.yaml` exists
- `'yarn'` if `yarn.lock` exists
- `'npm'` otherwise

## Credits

Thanks to [Guillermo Rauch](https://twitter.com/rauchg) for the idea.

## Meta

[CONTRIBUTING](/.github/CONTRIBUTING.md)

[LICENSE (MIT)](/LICENSE)
