import { dirname } from 'path';
import { buildExternalHelpers, transform } from '@babel/core';
import { createFilter } from 'rollup-pluginutils';
import preflightCheck from './preflightCheck.js';
import helperPlugin from './helperPlugin.js';
import { warnOnce } from './utils.js';
import { RUNTIME, EXTERNAL, HELPERS } from './constants.js';

export default function babel ( options ) {
	options = Object.assign( {}, options || {} );

	const filter = createFilter( options.include, options.exclude );
	delete options.include;
	delete options.exclude;

	if ( options.sourceMap !== false ) options.sourceMaps = true;
	if ( options.sourceMaps !== false ) options.sourceMaps = true;
	delete options.sourceMap;

	const runtimeHelpers = options.runtimeHelpers;
	delete options.runtimeHelpers;

	let externalHelpers;
	if ( options.externalHelpers ) externalHelpers = true;
	delete options.externalHelpers;

	let externalHelpersWhitelist = null;
	if ( options.externalHelpersWhitelist ) externalHelpersWhitelist = options.externalHelpersWhitelist;
	delete options.externalHelpersWhitelist;

	let warn = msg => console.warn(msg); // eslint-disable-line no-console

	return {
		name: 'babel',

		options ( options ) {
			warn = options.onwarn || warn;
		},

		resolveId ( id ) {
			if ( id === HELPERS ) return id;
		},

		load ( id ) {
			if ( id !== HELPERS ) {
				return;
			}

			return buildExternalHelpers( externalHelpersWhitelist, 'module' );
		},

		transform ( code, id ) {
			if ( !filter( id ) ) return null;
			if ( id === HELPERS ) return null;

			const helpers = preflightCheck( options, dirname( id ) );

			if ( helpers === EXTERNAL && !externalHelpers ) {
				warnOnce( warn, 'Using "external-helpers" plugin with rollup-plugin-babel is deprecated, as it now automatically deduplicates your Babel helpers.' );
			} else if ( helpers === RUNTIME && !runtimeHelpers ) {
				throw new Error( 'Runtime helpers are not enabled. Either exclude the transform-runtime Babel plugin or pass the `runtimeHelpers: true` option. See https://github.com/rollup/rollup-plugin-babel#configuring-babel for more information' );
			}

			let localOpts = Object.assign({ filename: id }, options);

			if ( helpers !== RUNTIME ) {
				localOpts = Object.assign({}, localOpts, { plugins: (localOpts.plugins || []).concat(helperPlugin) });
			}

			const transformed = transform( code, localOpts );

			return {
				code: transformed.code,
				map: transformed.map
			};
		}
	};
}
