import buble from 'rollup-plugin-buble';

var external = Object.keys( require( './package.json' ).dependencies );

export default {
	entry: 'src/index.js',
	plugins: [ buble() ],
	external: external
};
