import { readFileSync } from 'fs';

import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

import { createConfig } from '../../shared/rollup.config.mjs';

export default {
  ...createConfig({
    pkg: JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))
  }),
  input: 'src/index.ts',
  plugins: [
    resolve(),
    commonjs({ include: '../../node_modules/.pnpm/registry.npmjs.org/**' }),
    typescript({ include: '**/*.{ts,js}', module: 'esnext' })
  ]
};
