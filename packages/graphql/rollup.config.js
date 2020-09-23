import buble from 'rollup-plugin-buble';

const pkg = require('./package.json');

const external = Object.keys(pkg.dependencies);

export default {
	input: 'src/index.js',
	output: [
		{ file: pkg.main, format: 'cjs' },
		{ file: pkg.module, format: 'es' }
	],
	plugins: [ buble() ],
	external,
	sourceMap: true
};
