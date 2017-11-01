import buble from 'rollup-plugin-buble';

var pkg = require('./package.json');
var externalDeps = Object.keys(Object.assign({}, pkg.dependencies, pkg.peerDependencies));
var nodeDeps = ['path'];
var external = externalDeps.concat(nodeDeps);

export default {
	entry: 'src/index.js',
	plugins: [ buble() ],
	external: external,
	targets: [
		{ dest: 'dist/rollup-plugin-babel.cjs.js', format: 'cjs' },
		{ dest: 'dist/rollup-plugin-babel.es.js', format: 'es' }
	],
	sourceMap: true
};
