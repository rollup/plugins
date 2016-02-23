import { dirname, join } from 'path';
import { buildExternalHelpers, transform } from 'babel-core';
import { createFilter } from 'rollup-pluginutils';
import classes from 'babel-plugin-transform-es2015-classes';

const INLINE = {};
const RUNTIME = {};
const BUNDLED = {};

let preflightCheckResults = {};

function preflightCheck ( options, dir ) {
	if ( !preflightCheckResults[ dir ] ) {
		let helpers;

		options = assign( {}, options );
		options.filename = join( dir, 'x.js' );

		if ( !options.plugins ) options.plugins = [];
		options.plugins.push( classes );

		const check = transform( 'export default class Foo {}', options ).code;

		if ( !~check.indexOf( 'export default' ) && !~check.indexOf( 'export { Foo as default }' ) ) throw new Error( 'It looks like your Babel configuration specifies a module transformer. Please disable it. If you\'re using the "es2015" preset, consider using "es2015-rollup" instead. See https://github.com/rollup/rollup-plugin-babel#configuring-babel for more information' );

		if ( ~check.indexOf( 'import _classCallCheck from "babel-runtime' ) ) helpers = RUNTIME;
		else if ( ~check.indexOf( 'function _classCallCheck' ) ) helpers = INLINE;
		else if ( ~check.indexOf( 'babelHelpers' ) ) helpers = BUNDLED;

		else {
			throw new Error( 'An unexpected situation arose. Please raise an issue at https://github.com/rollup/rollup-plugin-babel/issues. Thanks!' );
		}

		preflightCheckResults[ dir ] = helpers;
	}

	return preflightCheckResults[ dir ];
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

	var externalHelpers;
	if ( options.externalHelpers ) externalHelpers = true;
	delete options.externalHelpers;

	return {
		transform ( code, id ) {
			if ( !filter( id ) ) return null;

			const helpers = preflightCheck( options, dirname( id ) );
			var localOpts = assign({ filename: id }, options );

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
							warnOnce( `The '${helper}' Babel helper is used more than once in your code. It's strongly recommended that you use the "external-helpers" plugin or the "es2015-rollup" preset. See https://github.com/rollup/rollup-plugin-babel#configuring-babel for more information` );
						}

						inlineHelpers[ helper ] = true;
					});
				}
			}

			return {
				code: transformed.code,
				map: transformed.map
			};
		},
		intro () {
			if ( externalHelpers ) return '';
			const helpers = Object.keys( bundledHelpers );
			if ( !helpers.length ) return '';

			return buildExternalHelpers( helpers, 'var' ).trim() + '\n';
		}
	};
}
