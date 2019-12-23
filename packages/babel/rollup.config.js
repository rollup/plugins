import pkg from './package.json';

const externalDeps = Object.keys(Object.assign({}, pkg.dependencies, pkg.peerDependencies));
const nodeDeps = ['path'];

export default {
	input: './src/index.js',
	external: externalDeps.concat(nodeDeps),
	output: [
		{ file: pkg.main, format: 'cjs' },
		{ file: pkg.module, format: 'esm' },
	],
};
