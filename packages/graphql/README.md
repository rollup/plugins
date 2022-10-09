[npm]: https://img.shields.io/npm/v/@rollup/plugin-graphql
[npm-url]: https://www.npmjs.com/package/@rollup/plugin-graphql
[size]: https://packagephobia.now.sh/badge?p=@rollup/plugin-graphql
[size-url]: https://packagephobia.now.sh/result?p=@rollup/plugin-graphql

[![npm][npm]][npm-url]
[![size][size]][size-url]
[![libera manifesto](https://img.shields.io/badge/libera-manifesto-lightgrey.svg)](https://liberamanifesto.com)

# @rollup/plugin-graphql

🍣 A Rollup plugin which Converts .gql/.graphql(s) files to ES6 modules.

## Requirements

This plugin requires an [LTS](https://github.com/nodejs/Release) Node version (v14.0.0+) and Rollup v1.20.0+.

## Install

Using npm:

```console
npm install @rollup/plugin-graphql --save-dev
```

## Usage

Create a `rollup.config.js` [configuration file](https://www.rollupjs.org/guide/en/#configuration-files) and import the plugin:

```js
import graphql from '@rollup/plugin-graphql';

export default {
  input: 'src/index.js',
  output: {
    dir: 'output',
    format: 'cjs'
  },
  plugins: [graphql()]
};
```

Then call `rollup` either via the [CLI](https://www.rollupjs.org/guide/en/#command-line-reference) or the [API](https://www.rollupjs.org/guide/en/#javascript-api).

With an accompanying file `src/index.js`, you can import GraphQL files or named queries/mutations:

```js
// src/index.js

// import a GraphQL Document from a GraphQL file,
import schema from './schema.graphql';

// or import named Query/Mutation
import { BatmanQuery, JokerMutation } from './schema.graphql';
```

#### Fragments

Thanks to [graphql-tag](https://github.com/apollographql/graphql-tag), fragments import is supported by using `#import "..."`.

Given the following file `heroFragment.graphql`:

```graphql
fragment HeroFragment on Hero {
  id
  name
}
```

You can import it like this:

```graphql
#import "./heroFragment.graphql"

query AllHeroes {
  heros {
    ...HeroFragment
  }
}
```

## Options

### `exclude`

Type: `String` | `Array[...String]`<br>
Default: `null`

A [picomatch pattern](https://github.com/micromatch/picomatch), or array of patterns, which specifies the files in the build the plugin should _ignore_. By default no files are ignored.

### `include`

Type: `String` | `Array[...String]`<br>
Default: `null`

A [picomatch pattern](https://github.com/micromatch/picomatch), or array of patterns, which specifies the files in the build the plugin should operate on. By default all files are targeted.

## Meta

[CONTRIBUTING](/.github/CONTRIBUTING.md)

[LICENSE (MIT)](/LICENSE)
