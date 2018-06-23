import buble from 'rollup-plugin-buble';

var pkg = require('./package.json');
var externalDeps = Object.keys(Object.assign({}, pkg.dependencies, pkg.peerDependencies));
var nodeDeps = ['path'];
var external = externalDeps.concat(nodeDeps);

export default {
	input: 'src/index.js',
	plugins: [ buble({ objectAssign: 'Object.assign' }) ],
	external: external,
	output: [
		{
			file: 'dist/rollup-plugin-babel.cjs.js',
			format: 'cjs',
			sourcemap: true,
		},
		{
			file: 'dist/rollup-plugin-babel.es.js',
			format: 'es',
			sourcemap: true,
		},
	]
};
