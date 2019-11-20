# rollup-plugin-virtual

Load modules from memory.

## Usage

Suppose you have an input file like this, and you want to load `foo` and `src/bar.js` from memory:

```js
// src.main.js
import foo from 'foo';
import bar from './bar.js';

console.log(foo, bar);
```

```js
// rollup.config.js
import virtual from 'rollup-plugin-virtual';

export default {
  entry: 'src/main.js',
  // ...
  plugins: [
    virtual({
      foo: 'export default 1',
      'src/bar.js': 'export default 2'
    })
  ]
};
```

If there were named exports:

```js
// src.main.js
export { foo, bar } from 'foobar';

console.log(foo, bar);
```

```js
// rollup.config.js
// ...
virtual({
  foobar: `
        export const foo = vendor._foobar.foo;
        export const bar = vendor._foobar.bar;
      `
});
```

Use this plugin **before** any other one like node-resolve or commonjs so they do not alter the output.

## License

[MIT](LICENSE)
