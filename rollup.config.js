import buble from 'rollup-plugin-buble';

var pkg = require('./package.json');

export default {
	entry: 'index.js',
	plugins: [buble()],
	targets: [
		{
			format: 'cjs',
			dest: pkg['main']
		},
		{
			format: 'es6',
			dest: pkg['jsnext:main']
		}
	]
};
