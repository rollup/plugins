[cover]: https://codecov.io/gh/rollup/plugins/branch/master/graph/badge.svg
[cover-url]: https://codecov.io/gh/rollup/plugins
[discord]: https://img.shields.io/discord/466787075518365708?color=778cd1&label=chat
[discord-url]: https://is.gd/rollup_chat
[tests]: https://img.shields.io/circleci/project/github/rollup/plugins.svg
[tests-url]: https://circleci.com/gh/rollup/plugins

[![tests][tests]][tests-url]
[![cover][cover]][cover-url]
[![discord][discord]][discord-url]
[![libera manifesto](https://img.shields.io/badge/libera-manifesto-lightgrey.svg)](https://liberamanifesto.com)

# Rollup Plugins

🍣 The one-stop shop for official Rollup plugins

This repository houses plugins that Rollup considers critical to every day use of Rollup, plugins which the organization has adopted maintenance of, and plugins that the project recommends to its users.

## Plugins Found Here

|                                                     |                                                                                           |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| [alias](packages/alias)                             | Define and resolve aliases for bundle dependencies                                        |
| [auto-install](packages/auto-install)               | Automatically install dependencies that are imported by a bundle                          |
| [babel](packages/babel)                             | Compile your files with Babel                                                             |
| [beep](packages/beep)                               | System beeps on errors and warnings                                                       |
| [buble](packages/buble)                             | Compile ES2015 with buble                                                                 |
| [commonjs](packages/commonjs)                       | Convert CommonJS modules to ES6                                                           |
| [data-uri](packages/data-uri)                       | Import modules from Data URIs                                                             |
| [dsv](packages/dsv)                                 | Convert .csv and .tsv files into JavaScript modules with d3-dsv                           |
| [dynamic-import-vars](packages/dynamic-import-vars) | Resolving dynamic imports that contain variables.                                         |
| [eslint](packages/eslint)                           | Verify entry point and all imported files with ESLint                                     |
| [graphql](packages/graphql)                         | Convert .gql/.graphql files to ES6 modules                                                |
| [html](packages/html)                               | Create HTML files to serve Rollup bundles                                                 |
| [image](packages/image)                             | Import JPG, PNG, GIF, SVG, and WebP files                                                 |
| [inject](packages/inject)                           | Scan modules for global variables and injects `import` statements where necessary         |
| [json](packages/json)                               | Convert .json files to ES6 modules                                                        |
| [legacy](packages/legacy)                           | Add `export` declarations to legacy non-module scripts                                    |
| [multi-entry](packages/multi-entry)                 | Use multiple entry points for a bundle                                                    |
| [node-resolve](packages/node-resolve)               | Locate and bundle third-party dependencies in node_modules                                |
| [replace](packages/replace)                         | Replace strings in files while bundling                                                   |
| [run](packages/run)                                 | Run your bundles in Node once they're built                                               |
| [strip](packages/strip)                             | Remove debugger statements and functions like assert.equal and console.log from your code |
| [sucrase](packages/sucrase)                         | Compile TypeScript, Flow, JSX, etc with Sucrase                                           |
| [typescript](packages/typescript)                   | Integration between Rollup and Typescript                                                 |
| [url](packages/url)                                 | Import files as data-URIs or ES Modules                                                   |
| [virtual](packages/virtual)                         | Load virtual modules from memory                                                          |
| [wasm](packages/wasm)                               | Import WebAssembly code with Rollup                                                       |
| [yaml](packages/yaml)                               | Convert YAML files to ES6 modules                                                         |
|                                                     |                                                                                           |

## Other Packages Found Here

|                                     |                                                            |
| ----------------------------------- | ---------------------------------------------------------- |
| [pluginutils](packages/pluginutils) | A set of utility functions commonly used by Rollup plugins |
|                                     |                                                            |

## Contributing

This repository is a [monorepo](https://en.wikipedia.org/wiki/Monorepo) which leverages [pnpm](https://pnpm.js.org/) for dependency management.

To begin, please install `pnpm`:

```console
$ npm install pnpm -g
```

### Working with Plugin Packages

All plugin packages are kept in the `/packages` directory.

#### Adding dependencies:

```console
$ pnpm add <package> --filter ./packages/<name>
```

Where `<package>` is the name of the NPM package you wish to add for a plugin package, and `<name>` is the proper name of the plugin. e.g. `@rollup/plugin-beep`.

#### Publishing:

```console
$ pnpm publish -- <name> [flags]
```

Where `<name>` is the portion of the plugin package name following `@rollup/plugin-`. (e.g. `beep`)

The publish script performs the following actions:

- Gathers commits from the last release tag
- Determines the next appropriate version bump (major, minor, or patch)
- Updates `package.json`
- Generates a new ChangeLog entry
- Updates `CHANGELOG.md` for the target plugin
- Commits `package.json` and `CHANGELOG.md`, with a commit message is in the form `chore(release): <name>-v<version>`
- Publishes to NPM
- Tags the release in the form `<name>-v<version>` (e.g. `beep-v0.1.0`)
- Pushes the commit and tag to Github

##### Flags

The following flags are available to modify the publish process:

- `--dry` tells the script to perform a dry-run, skipping any file modifications, NPM, or Git Actions. Results from version determination and new ChangeLog additions are displayed.
- `--major`, `--minor`, `--patch` can be used to force a particular type of semver bump.
- `--no-push` will instruct the script not to push changes and tags to Git.
- `--no-tag` will instruct the script not to tag the release.

#### Running Tests:

To run tests on all packages which have changes:

```console
$ pnpm test
```

To run tests on a specific package:

```console
$ pnpm test --filter ./packages/<name>
```

Linting:

To lint all packages which have changes:

```console
$ pnpm lint
```

To lint a specific package:

```console
$ pnpm lint --filter ./packages/<name>
```

_Note: Scripts in the repository will run the root `test` and `lint` script on those packages which have changes. This is also how the CI pipelines function. To run either on a package outside of that pipeline, use `pnpm <script> -- @rollup/plugin-<name>`._

## Adding Plugins

While we don't have an official procedure for adding third-party plugins to this repository, we are absolutely open to the idea. If you'd like to speak about your project being a part of this repo, please reach out to [@RollupJS](https://twitter.com/RollupJS) on Twitter.

## Meta

[CONTRIBUTING](./.github/CONTRIBUTING.md)

[LICENSE (MIT)](./LICENSE)
