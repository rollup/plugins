# rollup-plugin-buble

Convert ES2015 with buble.

## Installation

```bash
npm install --save-dev @rollup/plugin-buble
```

## Usage

```js
import { rollup } from 'rollup';
import buble from '@rollup/plugin-buble';

rollup({
  entry: 'main.js',
  plugins: [ buble() ]
}).then(...)
```

## Options

- `include`: a [micromatch](https://github.com/micromatch/micromatch) pattern, or array of patterns, specifying files to include
- `exclude`: a [micromatch](https://github.com/micromatch/micromatch) pattern, or array of patterns, specifying files to exclude
- `transforms`: an object of transform options, per the [Buble docs](https://buble.surge.sh/guide/)

## License

MIT
