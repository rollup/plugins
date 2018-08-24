import { dirname } from 'path';
import { buildExternalHelpers, DEFAULT_EXTENSIONS, transform } from '@babel/core';
import { createFilter } from 'rollup-pluginutils';
import createPreflightCheck from './preflightCheck.js';
import helperPlugin from './helperPlugin.js';
import { escapeRegExpCharacters, warnOnce } from './utils.js';
import { RUNTIME, EXTERNAL, HELPERS } from './constants.js';

const unpackOptions = ({
	extensions = DEFAULT_EXTENSIONS,
	// rollup uses sourcemap, babel uses sourceMaps
	// just normalize them here so people don't have to worry about it
	sourcemap = true,
	sourcemaps = true,
	sourceMap = true,
	sourceMaps = true,
	...rest
} = {}) => ({
	extensions,
	sourceMaps: sourcemap && sourcemaps && sourceMap && sourceMaps,
	...rest,
});

export default function babel ( options ) {
	const {
		exclude,
		extensions,
		externalHelpers,
		externalHelpersWhitelist,
		include,
		runtimeHelpers,
		...babelOptions
	} = unpackOptions(options);

	const extensionRegExp = new RegExp(`(${extensions.map(escapeRegExpCharacters).join('|')})$`);
	const includeExcludeFilter = createFilter( include, exclude );
	const filter = id => extensionRegExp.test(id) && includeExcludeFilter(id);
	const preflightCheck = createPreflightCheck();

	return {
		name: 'babel',

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

			const helpers = preflightCheck( this, babelOptions, dirname( id ) );

			if ( helpers === EXTERNAL && !externalHelpers ) {
				warnOnce( this, 'Using "external-helpers" plugin with rollup-plugin-babel is deprecated, as it now automatically deduplicates your Babel helpers.' );
			} else if ( helpers === RUNTIME && !runtimeHelpers ) {
				this.error( 'Runtime helpers are not enabled. Either exclude the transform-runtime Babel plugin or pass the `runtimeHelpers: true` option. See https://github.com/rollup/rollup-plugin-babel#configuring-babel for more information' );
			}

			let localOpts = Object.assign({ filename: id }, babelOptions);

			if ( helpers !== RUNTIME ) {
				localOpts = Object.assign({}, localOpts, { plugins: (localOpts.plugins || []).concat(helperPlugin) });
			}

			const transformed = transform( code, localOpts );

			if (!transformed) {
				return { code };
			}

			return {
				code: transformed.code,
				map: transformed.map
			};
		}
	};
}
