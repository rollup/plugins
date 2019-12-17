import buble from 'rollup-plugin-buble';
import pkg from './package.json';

const externalDeps = Object.keys(Object.assign({}, pkg.dependencies, pkg.peerDependencies));
const nodeDeps = ['path'];
const external = externalDeps.concat(nodeDeps);

export default {
	input: './src/index.js',
	plugins: [buble({ objectAssign: 'Object.assign', transforms: { asyncAwait: false } })],
	external,
	output: [
		{ file: pkg.main, format: 'cjs', sourcemap: true },
		{ file: pkg.module, format: 'esm', sourcemap: true },
	],
};
