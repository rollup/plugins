var path = require( 'path' );
var babel = require( 'babel-core' );
var createFilter = require( 'rollup-pluginutils' ).createFilter;
var assign = require( 'object-assign' );

function preflightCheck ( localOpts ) {
	var check = babel.transform( 'export default class Foo {}', localOpts ).code;
	if ( ~check.indexOf( 'function _classCallCheck' ) ) throw new Error( 'External helpers are not enabled. Please add the "external-helpers-2" plugin or use the "es2015-rollup" preset. See https://github.com/rollup/rollup-plugin-babel#TK for more information' );
	if ( !~check.indexOf( 'export default' ) ) throw new Error( 'It looks like your Babel configuration specifies a module transformer. Please disable it. If you\'re using the "es2015" preset, consider using "es2015-rollup" instead. See https://github.com/rollup/rollup-plugin-babel#TK for more information' );
}

module.exports = function ( options ) {
	options = assign( {}, options || {} );
	var usedHelpers = [];
	var index;

	var filter = createFilter( options.include, options.exclude );
	delete options.include;
	delete options.exclude;

	if ( options.sourceMap !== false ) options.sourceMaps = true;
	if ( options.sourceMaps !== false ) options.sourceMaps = true;
	delete options.sourceMap;

	return {
		transform: function ( code, id ) {
			if ( !filter( id ) ) return null;

			var localOpts = assign({ filename: id }, options );
			preflightCheck( localOpts );

			var transformed = babel.transform( code, localOpts );

			transformed.metadata.usedHelpers.forEach( function ( helper ) {
				if ( !~usedHelpers.indexOf( helper ) ) usedHelpers.push( helper );
			});

			return {
				code: transformed.code,
				map: transformed.map
			};
		},
		intro: function () {
			// TODO replace babelHelpers.foo with babelHelpers_foo – though first
			// we need the ability to find and replace within the generated bundle
			return usedHelpers.length ?
				babel.buildExternalHelpers( usedHelpers, 'var' ).trim() :
				'';
		}
	};
};
