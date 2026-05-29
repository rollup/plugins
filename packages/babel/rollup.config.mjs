import { readFileSync } from 'fs';

import { createConfig, emitModulePackageFile } from '../../shared/rollup.config.mjs';

import { babel } from './src/index.js';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

export default {
  ...createConfig({ pkg }),
  input: {
    index: './src/index.js',
    worker: './src/worker.js'
  },
  output: [
    {
      format: 'cjs',
      dir: 'dist/cjs',
      exports: 'named',
      footer(chunkInfo) {
        if (chunkInfo.name === 'index') {
          return 'module.exports = Object.assign(exports.default, exports);';
        }
        return null;
      },
      sourcemap: true
    },
    {
      format: 'es',
      dir: 'dist/es',
      plugins: [emitModulePackageFile()],
      sourcemap: true
    }
  ],
  plugins: [
    babel({
      presets: [['@babel/preset-env', { targets: { node: 14 } }]],
      babelHelpers: 'bundled'
    })
  ]
};
