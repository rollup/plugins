import { readFileSync } from 'fs';

import { createConfig } from '../../shared/rollup.config.mjs';

import { babel } from './src/index.js';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

export default {
  ...createConfig({ pkg }),
  input: './src/index.js',
  plugins: [
    babel({
      presets: [['@babel/preset-env', { targets: { node: 14 } }]],
      babelHelpers: 'bundled'
    })
  ]
};
