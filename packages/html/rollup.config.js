import typescript from '@rollup/plugin-typescript';

import { createConfig } from '../../shared/rollup.config';

import pkg from './package.json';

export default {
  ...createConfig(pkg),
  plugins: [typescript({ sourceMap: false })]
};
