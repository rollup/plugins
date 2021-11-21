import type { RollupOptions } from 'rollup';

import commonjs from '..';

const config: RollupOptions = {
  input: 'main.js',
  output: {
    file: 'bundle.js',
    format: 'iife'
  },
  plugins: [
    commonjs({
      include: 'node_modules/**',
      esmExternals: ['foo', 'bar'],
      exclude: ['node_modules/foo/**', 'node_modules/bar/**', /node_modules/],
      extensions: ['.js', '.coffee'],
      ignoreGlobal: false,
      ignoreDynamicRequires: true,
      requireReturnsDefault: 'auto',
      sourceMap: false,
      transformMixedEsModules: false,
      ignore: ['conditional-runtime-dependency'],
      dynamicRequireTargets: ['node_modules/logform/*.js'],
      dynamicRequireRoot: 'node_modules',
      strictRequires: ['node_modules/foo/*.js']
    })
  ]
};

export default config;
