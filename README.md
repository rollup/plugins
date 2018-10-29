# @rollup/plugin-auto-install

Automatically install dependencies that are imported by your bundle, but aren't yet in package.json.

## Usage

Install in the usual fashion...

```
npm install -D @rollup/plugin-auto-install
```

...then add to your plugins array, ensuring that it goes *before* [rollup-plugin-node-resolve](https://github.com/rollup/rollup-plugin-node-resolve):

```js
// rollup.config.js
import auto from '@rollup/plugin-auto-install';
import resolve from 'rollup-plugin-node-resolve';

export default {
  input: 'src/main.js',
  output: {
    dir: 'public/js',
    format: 'esm'
  },
  plugins: [
    auto(),
    resolve()
  ]
};
```

### Options

```js
auto({
  // the location of your package.json — this will be created
  // if it doesn't already exist, since package managers need
  // to populate the `dependencies` field
  pkgFile: 'package.json',

  // whether to use npm or yarn. This defaults to yarn if a
  // yarn.lock file exists, or npm otherwise
  manager: 'yarn'
})
```

## Credits

Thanks to [Guillermo Rauch](https://twitter.com/rauchg) for the idea.


## License

[LIL](LICENSE)