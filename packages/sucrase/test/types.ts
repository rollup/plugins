import type { RollupOptions } from 'rollup';

import sucrase from '..';

const config: RollupOptions = {
  input: 'main.js',
  output: {
    file: 'bundle.js',
    format: 'iife'
  },
  plugins: [
    sucrase({
      include: 'node_modules/**',
      exclude: ['node_modules/foo/**', 'node_modules/bar/**'],
      enableLegacyBabel5ModuleInterop: true,
      enableLegacyTypeScriptModuleInterop: true,
      jsxFragmentPragma: 'React.fragment',
      jsxPragma: 'React',
      jsxRuntime: 'classic',
      production: true,
      disableESTransforms: true,
      transforms: ['jsx']
    })
  ]
};

export default config;
