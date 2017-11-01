import { join } from 'path';
import { transform } from '@babel/core';
import { INLINE, RUNTIME, EXTERNAL } from './constants.js';

function fallbackClassTransform () {
	return {
		visitor: {
			ClassDeclaration (path, state) {
				path.replaceWith(path, state.file.addHelper('inherits'));
			}
		}
	};
}

let preflightCheckResults = {};

export default function preflightCheck ( options, dir ) {
	if ( !preflightCheckResults[ dir ] ) {
		let helpers;

		options = Object.assign( {}, options );
		delete options.only;
		delete options.ignore;

		options.filename = join( dir, 'x.js' );

		const inputCode = 'class Foo extends Bar {};\nexport default Foo;';
		let check = transform( inputCode, options ).code;

		if ( ~check.indexOf('class ') ) {
			options.plugins = (options.plugins || []).concat( fallbackClassTransform );
			check = transform( inputCode, options ).code;
		}

		if ( ~check.indexOf( 'import _inherits' ) ) helpers = RUNTIME;
		else if ( ~check.indexOf( 'function _inherits' ) ) helpers = INLINE;
		else if ( ~check.indexOf( 'babelHelpers' ) ) helpers = EXTERNAL;
		else {
			throw new Error( 'An unexpected situation arose. Please raise an issue at https://github.com/rollup/rollup-plugin-babel/issues. Thanks!' );
		}

		if ( !~check.indexOf( 'export default' ) && !~check.indexOf( 'export default Foo' ) ) throw new Error( 'It looks like your Babel configuration specifies a module transformer. Please disable it. See https://github.com/rollup/rollup-plugin-babel#configuring-babel for more information' );

		preflightCheckResults[ dir ] = helpers;
	}

	return preflightCheckResults[ dir ];
}
