[npm]: https://img.shields.io/npm/v/@rollup/plugin-wasm
[npm-url]: https://www.npmjs.com/package/@rollup/plugin-wasm
[size]: https://packagephobia.now.sh/badge?p=@rollup/plugin-wasm
[size-url]: https://packagephobia.now.sh/result?p=@rollup/plugin-wasm

[![npm][npm]][npm-url]
[![size][size]][size-url]
[![libera manifesto](https://img.shields.io/badge/libera-manifesto-lightgrey.svg)](https://liberamanifesto.com)

# @rollup/plugin-wasm

🍣 A Rollup which allows importing and bundling [WebAssembly modules](http://webassembly.org).

WebAssembly Modules are imported asynchronous as base64 strings. Small modules [can be imported synchronously](#synchronous-modules).

## Requirements

This plugin requires an [LTS](https://github.com/nodejs/Release) Node version (v14.0.0+) and Rollup v1.20.0+.

## Install

Using npm:

```console
npm install @rollup/plugin-wasm --save-dev
```

## Usage

Create a `rollup.config.js` [configuration file](https://www.rollupjs.org/guide/en/#configuration-files) and import the plugin:

```js
import { wasm } from '@rollup/plugin-wasm';

export default {
  input: 'src/index.js',
  output: {
    dir: 'output',
    format: 'cjs'
  },
  plugins: [wasm()]
};
```

Then call `rollup` either via the [CLI](https://www.rollupjs.org/guide/en/#command-line-reference) or the [API](https://www.rollupjs.org/guide/en/#javascript-api).

## Options

### `sync`

Type: `Array[...String]`<br>
Default: `null`

Specifies an array of strings that each represent a WebAssembly file to load synchronously. See [Synchronous Modules](#synchronous-modules) for a functional example.

### `maxFileSize`

Type: `Number`<br>
Default: `14336` (14kb)

The maximum file size for inline files. If a file exceeds this limit, it will be copied to the destination folder and loaded from a separate file at runtime. If `maxFileSize` is set to `0` all files will be copied.

Files specified in `sync` to load synchronously are always inlined, regardless of size.

### `fileName`

Type: `String`<br>
Default: `'[hash][extname]'`

This option can be used to rename the emitted Wasm files. It accepts the following string replacements:

- `[hash]` - The hash value of the file's contents
- `[name]` - The name of the imported file (without its file extension)
- `[extname]` - The extension of the imported file (including the leading `.`)

### `publicPath`

Type: `String`<br>
Default: (empty string)

A string which will be added in front of filenames when they are not inlined but are copied.

### `targetEnv`

Type: `"auto" | "browser" | "node"`<br>
Default: `"auto"`

Configures what code is emitted to instantiate the Wasm (both inline and separate):

- `"auto"` will determine the environment at runtime and invoke the correct methods accordingly
- `"auto-inline"` always inlines the Wasm and will decode it according to the environment
- `"browser"` omits emitting code that requires node.js builtin modules that may play havoc on downstream bundlers
- `"node"` omits emitting code that requires `fetch`

## Usage

This plugin looks for `import` statements where the file specifier ends with `.wasm`, such as:

```js
import wasm from './example.wasm';
```

The WebAssembly is inlined as a base64 encoded string. At runtime the string is decoded and a module is returned.

_Note: The base64 string that represents the WebAssembly within the bundle will be ~33% larger than the original file._

When bundled, `wasm` is a function you can use to instantiate the functionality inside of the WebAssembly module. This function returns a promise, so you can instantiate the module like this:

```js
import wasm from './example.wasm';

wasm().then(({ instance }) => {
  // use instance
});

// or use top-level await
const { instance } = await wasm();
```

The promise returns an object with an `instance` property that is a [`WebAssembly.Module`](https://developer.mozilla.org/en-US/docs/WebAssembly/JavaScript_interface/Module) object that you can use to interact with the WebAssembly module.

For example, given the following simple C file:

```c
int main() {
  return 42;
}
```

Compile the file using `emscripten`, or the online [WasmFiddle](https://wasdk.github.io/WasmFiddle/) tool. Then import and instantiate the resulting file:

```js
import sample from './sample.wasm';

sample().then(({ instance }) => {
  console.log(instance.exports.main());
});
```

### Passing Imports and Memory

If you'd like to pass any imports or memory into your WebAssembly module, you can do so by passing those as arguments to the WebAssembly loader function, like this:

```js
import sample from './sample.wasm';

const memory = new WebAssembly.Memory({ initial: 10, maximum: 100 });

const options = {
  js: {
    mem: memory
  },
  imports: {
    log: (arg) => console.log(arg)
  }
};

sample(options).then(({ instance }) => {
  console.log(instance.exports.main());
});
```

Because this example passes in `imports`, the `instance` becomes an instance of [`WebAssembly.Instance`](https://developer.mozilla.org/en-US/docs/WebAssembly/JavaScript_interface/Instance) and gives the WebAssembly code access to the imports and memory from JavaScript.

\_\_Note: Just passing in memory will result in a `WebAssembly.Module` as `instance`; it's only `imports` that triggers the creation of `WebAssembly.Instance`.

### Using with wasm-bindgen and wasm-pack

If you are writing Rust code and using [`wasm-bindgen`](https://github.com/rustwasm/wasm-bindgen) or [`wasm-pack`](https://github.com/rustwasm/wasm-pack), you'll need to use a different process for instantiating your WebAssembly modules. Because WebAssembly files generated by these tools require specific imports, you cannot provide these yourself.

The best setting to use with `wasm-bindgen` or `wasm-pack` is `--target web`. This will generate your WebAssembly files (such as `sample_bg.wasm`) with a JavaScript wrapper (such as `sample.js`). The JavaScript wrapper contains all of the instantiation code you'll need.

You'll need to import both the JavaScript file and the WebAssembly file into your project. Then, run the WebAssembly loading function and pass that into the `init()` function from the JavaScript file. Here's an example:

```js
import init, { main } from '../build/sample.js';
import sample from '../build/sample_bg.wasm';

sample()
  .then({ instance } => init(instance))
  .then(() => main());

// or using top-level await

await init(await sample());
main();
```

Unlike with the `emscripten` example, you'll need to import the methods you want to use directly from the JavaScript file rather than accessing them on the `WebAssembly.Instance`.

### Synchronous Modules

JavaScript runtimes allow small modules (< 4KB) to be compiled synchronously. If you'd like to specify some files to be compiled synchronously, you can do so in your `rollup.config.js` file.

```js
import { wasm } from '@rollup/plugin-wasm';

export default {
  input: 'src/index.js',
  output: {
    dir: 'output',
    format: 'cjs'
  },
  plugins: [
    wasm({
      sync: ['web/sample.wasm', 'web/foobar.wasm']
    });
  ]
};
```

Synchronous modules return a synchronous loader function that returns either a `WebAssembly.Module` or `WebAssembly.Instance` directly (not a promise). So you can use the module directly, like this:

```js
import sample from './sample.wasm';

const instance = sample({ ...imports });

console.log(instance.exports.main());
```

## Meta

[CONTRIBUTING](/.github/CONTRIBUTING.md)

[LICENSE (MIT)](/LICENSE)
