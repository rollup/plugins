import { buildExternalHelpers, transform } from 'babel-core';
import { createFilter } from 'rollup-pluginutils';

const INLINE = {};
const RUNTIME = {};
const BUNDLED = {};

function preflightCheck ( localOpts ) {
	var check = transform( 'export default class Foo {}', localOpts ).code;

	if ( !~check.indexOf( 'export default' ) && !~check.indexOf( 'export { Foo as default }' ) ) throw new Error( 'It looks like your Babel configuration specifies a module transformer. Please disable it. If you\'re using the "es2015" preset, consider using "es2015-rollup" instead. See https://github.com/rollup/rollup-plugin-babel#TK for more information' );

	if ( ~check.indexOf( 'import _classCallCheck from "babel-runtime' ) ) return RUNTIME;
	if ( ~check.indexOf( 'function _classCallCheck' ) ) return INLINE;
	if ( ~check.indexOf( 'babelHelpers' ) ) return BUNDLED;

	throw new Error( 'An unexpected situation arose. Please raise an issue at https://github.com/rollup/rollup-plugin-babel/issues. Thanks!' );
}

function assign ( target, source ) {
	Object.keys( source ).forEach( key => {
		target[ key ] = source[ key ];
	});
	return target;
}

let warned = {};
function warnOnce ( msg ) {
	if ( warned[ msg ] ) return;
	warned[ msg ] = true;
	console.warn( msg );
}

export default function babel ( options ) {
	options = assign( {}, options || {} );
	var bundledHelpers = {};
	var inlineHelpers = {};

	var filter = createFilter( options.include, options.exclude );
	delete options.include;
	delete options.exclude;

	if ( options.sourceMap !== false ) options.sourceMaps = true;
	if ( options.sourceMaps !== false ) options.sourceMaps = true;
	delete options.sourceMap;

	const runtimeHelpers = options.runtimeHelpers;
	delete options.runtimeHelpers;

	return {
		transform ( code, id ) {
			if ( !filter( id ) ) return null;

			var localOpts = assign({ filename: id }, options );
			const helpers = preflightCheck( localOpts );

			var transformed = transform( code, localOpts );
			const { usedHelpers } = transformed.metadata;

			if ( usedHelpers.length ) {
				if ( helpers === BUNDLED ) {
					usedHelpers.forEach( helper => {
						bundledHelpers[ helper ] = true;
					});
				} else if ( helpers === RUNTIME && !runtimeHelpers ) {
					throw new Error( 'Runtime helpers are not enabled. Either exclude the transform-runtime Babel plugin or pass the `runtimeHelpers: true` option. See https://github.com/rollup/rollup-plugin-babel#configuring-babel for more information' );
				} else {
					usedHelpers.forEach( helper => {
						if ( inlineHelpers[ helper ] ) {
							warnOnce( `The '${helper} Babel helper is used more than once in your code. It's strongly recommended that you use the "external-helpers-2" plugin or the "es2015-rollup" preset. See https://github.com/rollup/rollup-plugin-babel#configuring-babel for more information` );
						}

						inlineHelpers[ helper ] = true;
					});
				}
			}

			return {
				code: transformed.code.replace( /babelHelpers\./g, 'babelHelpers_' ),
				map: transformed.map
			};
		},
		intro () {
			const helpers = Object.keys( bundledHelpers );
			if ( !helpers.length ) return '';

			return buildExternalHelpers( helpers, 'var' )
				.replace( /var babelHelpers.+\n/, '' )
				.replace( /babelHelpers\.(.+) = function(?: \w+)?/g, 'function babelHelpers_$1' )
				.replace( /babelHelpers\.(.+) = /g, 'var babelHelpers_$1 = ' )
				.replace( 'babelHelpers;', '' ) // not sure where this comes from...
				.trim() + '\n';
		}
	};
}
