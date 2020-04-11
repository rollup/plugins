import pkg from './package.json';
import { babel } from './src/index';

const externalDeps = Object.keys(Object.assign({}, pkg.dependencies, pkg.peerDependencies));
const nodeDeps = ['path'];

export default {
  input: './src/index.js',
  external: externalDeps.concat(nodeDeps),
  plugins: [
    babel({
      presets: [['@babel/preset-env', { targets: { node: 8 } }]],
      babelHelpers: 'bundled'
    })
  ],
  output: [
    { file: pkg.main, format: 'cjs', exports: 'named' },
    { file: pkg.module, format: 'esm' }
  ]
};
