import { RollupOptions } from 'rollup';

import legacy from '../types';

const config: RollupOptions = {
  input: 'main.js',
  output: {
    file: 'bundle.js',
    format: 'iife'
  },
  plugins: [
    legacy({
      'vendor/some-library.js': 'someLibrary',

      'vendor/another-library.js': {
        foo: 'anotherLib.foo',
        bar: 'anotherLib.bar',
        baz: 'anotherLib.baz'
      }
    })
  ]
};

export default config;
