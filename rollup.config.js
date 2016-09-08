var pkg = require('./package.json');

export default {
	entry: 'src/index.js',
	external: Object.keys(pkg.dependencies).concat(['path']),
	sourceMap: 'inline',
	targets: [
		{
			format: 'cjs',
			dest: pkg['main']
		},
		{
			format: 'es',
			dest: pkg['module']
		}
	]
};
