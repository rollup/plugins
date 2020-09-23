# rollup-plugin-graphql

Convert GraphQL files to ES6 modules:

:warning: This package is a fork of the [initial rollup-plugin-graphql](https://github.com/kamilkisiela/rollup-plugin-graphql).

This fork is compatible with Rollup ^1.0 - thanks to [@bennypowers](https://github.com/bennypowers) (https://github.com/kamilkisiela/rollup-plugin-graphql/pull/7).

And myself, I've just published the module on NPM to make the fork more easier to install on a project.

```js
// import a GraphQL Document from a GraphQL file,
import schema from './schema.graphql';

// or import named Query/Mutation
import { FooQuery, FooMutation } from './schema.graphql';
```


## Installation

```bash
npm install --save-dev @kocal/rollup-plugin-graphql
```


## Usage

```js
import { rollup } from 'rollup';
import graphql from '@kocal/rollup-plugin-graphql';

rollup({
  entry: 'main.js',
  plugins: [
    graphql()
  ]
});
```


## License

MIT
