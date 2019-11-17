[cover]: https://codecov.io/gh/rollup/plugins/branch/master/graph/badge.svg
[cover-url]: https://codecov.io/gh/rollup/plugins
[tests]: https://img.shields.io/circleci/project/github/rollup/plugins.svg
[tests-url]: https://circleci.com/gh/rollup/plugins

[![tests][tests]][tests-url]
[![cover][cover]][cover-url]
[![libera manifesto](https://img.shields.io/badge/libera-manifesto-lightgrey.svg)](https://liberamanifesto.com)

# Rollup Plugins

🍣 The one-stop shop for official Rollup plugins

This repository houses plugins that Rollup considers critical to every day use of Rollup, plugins which the organization has adopted maintenance of, and plugins that the project recommends to its users.

## Plugins Found Here

|                                       |                                                                                           |
| ------------------------------------- | ----------------------------------------------------------------------------------------- |
| [alias](packages/alias)               | Define and resolve aliases for bundle dependencies                                        |
| [auto-install](packages/auto-install) | Automatically install dependencies that are imported by a bundle.                         |
| [beep](packages/beep)                 | System beeps on errors and warnings                                                       |
| [buble](packages/buble)               | Compile ES2015 with buble                                                                 |
| [dsv](packages/dsv)                   | Convert .csv and .tsv files into JavaScript modules with d3-dsv                           |
| [inject](packages/inject)             | Scan modules for global variables and injects `import` statements where necessary         |
| [json](packages/json)                 | Convert .json files to ES6 modules                                                        |
| [replace](packages/replace)           | Replace strings in files while bundling                                                   |
| [strip](packages/strip)               | Remove debugger statements and functions like assert.equal and console.log from your code |
| [wasm](packages/wasm)                 | Import WebAssembly code with Rollup                                                       |
| [yaml](packages/yaml)                 | Convert YAML files to ES6 modules                                                         |
|                                       |                                                                                           |

## Contributing

This repository is a [monorepo](https://en.wikipedia.org/wiki/Monorepo) which leverages [pnpm](https://pnpm.js.org/) for dependency management.

To begin, please install `pnpm`:

```console
$ npm install pnpm -g
```

### Working with Plugin Packages

All plugin packages are kept in the `/packages` directory.

Adding dependencies:

```console
$ pnpm add <package> --filter ./packages/<name>
```

Where `<package>` is the name of the NPM package you wish to add for a plugin package, and `<name>` is the proper name of the plugin. e.g. `@rollup/plugin-beep`.

Publishing:

```console
$ pnpm run publish -- <name>
```

Where `<name>` is the portion of the plugin package name following `@rollup/plugin-`. e.g. `beep`. Publishing will create a new tag in the form of `<name>-v<version>` (e.g. `beep-v0.1.0`) and push the tag to the repo upon successful publish.

Commits for release should be in the form of `chore(release): <name>-v<version>`.

Running Tests:

To run tests on all packages which have changes:

```console
$ pnpm run test
```

To run tests on a specific package:

```console
$ pnpm run test --filter ./packages/<name>
```

Linting:

To lint all packages which have changes:

```console
$ pnpm run lint
```

To lint a specific package:

```console
$ pnpm run lint --filter ./packages/<name>
```

_Note: Scripts in the repository will run the root `test` and `lint` script on those packages which have changes. This is also how the CI pipelines function. To run either on a package outside of that pipeline, use `pnpm run <script> -- @rollup/plugin-<name>`._

## Adding Plugins

While we don't have an official procedure for adding third-party plugins to this repository, we are absolutely open to the idea. If you'd like to speak about your project being a part of this repo, please reach out to [@RollupJS](https://twitter.com/RollupJS) on Twitter.

## Meta

[CONTRIBUTING](./.github/CONTRIBUTING.md)

[LICENSE (Mozilla Public License)](./LICENSE)
