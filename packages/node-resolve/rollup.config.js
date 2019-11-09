import babel from 'rollup-plugin-babel';
import json from 'rollup-plugin-json';

export default {
	input: 'src/index.js',
	plugins: [
		json(),
		babel({
			presets: [['@babel/preset-env', {
				targets: {
					node: 6
				}
			}]
			]
		})
	],
	external: [ 'path', 'fs', 'builtin-modules', 'resolve', 'browser-resolve', 'is-module', 'rollup-pluginutils' ],
	output: [
		{ file: 'dist/rollup-plugin-node-resolve.cjs.js', format: 'cjs' },
		{ file: 'dist/rollup-plugin-node-resolve.es.js', format: 'es' }
	]
};
