# Rollup Plugins

🍣  The one-stop shop for official Rollup plugins

This repository houses plugins that Rollup considers critical to every day use of Rollup, plugins which the organization has adopted maintenance of, and plugins that the project recommends to its users.

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
$ pnpm add <package> -- @rollup/plugin-<name>
```

Where `<package>` is the name of the NPM package you wish to add for a plugin package, and `<name>` is the proper name of the plugin. e.g. `@rollup/plugin-beep`.

Running Tests:

```console
$ pnpm run test
```

Linting:

```console
$ pnpm run lint
```

_Note: Scripts in the repository will run the root `test` and `lint` script on those packages which have changes. This is also how the CI pipelines function. To run either on a package outside of that pipeline, use `pnpm run <script> -- @rollup/plugin-<name>`._

## Publishing Packages

WIP. Please stand by for more info.

## Adding Plugins

While we don't have an official procedure for adding third-party plugins to this repository, we are absolutely open to the idea. If you'd like to speak about your project being a part of this repo, please reach out to [@RollupJS](https://twitter.com/RollupJS) on Twitter.

## Meta

[CONTRIBUTING](./.github/CONTRIBUTING.md)

[LICENSE (Mozilla Public License)](./LICENSE)
