import * as babel from '@babel/core';
import { createFilter } from 'rollup-pluginutils';
import { RUNTIME, EXTERNAL, BUNDLED, INLINE, HELPERS } from './constants.js';
import bundledHelpersPlugin from './bundledHelpersPlugin.js';
import preflightCheck from './preflightCheck.js';
import transformCode from './transformCode';
import { addBabelPlugin, escapeRegExpCharacters, warnOnce } from './utils.js';

const unpackOptions = ({
	extensions = babel.DEFAULT_EXTENSIONS,
	// rollup uses sourcemap, babel uses sourceMaps
	// just normalize them here so people don't have to worry about it
	sourcemap = true,
	sourcemaps = true,
	sourceMap = true,
	sourceMaps = true,
	...rest
} = {}) => ({
	extensions,
	plugins: [],
	sourceMaps: sourcemap && sourcemaps && sourceMap && sourceMaps,
	...rest,
	caller: {
		name: 'rollup-plugin-babel',
		...rest.caller,
	},
});

const unpackInputPluginOptions = ({ skipPreflightCheck = false, ...rest }) => {
	if (!rest.babelHelpers) {
		console.warn(
			'You should specify how do you want to bundle/import "Babel helpers" (runtime functions inserted by Babel which are used by some transformations).\n\n' +
				`Please pass \`babelHelpers\` option to the rollup-plugin-babel with one of the following values ("${BUNDLED}" is the default):\n` +
				`  - "${RUNTIME}" - you should use it especially when building libraries with rollup. It has to be used in combination with \`@babel/plugin-transform-runtime\` and you should also specify \`@babel/runtime\` as dependency of your package (don't forget to tell rollup to treat it is your external dependency when bundling for cjs & esm formats).\n` +
				`  - "${BUNDLED}" - you should use it if you want your resulting bundle to contain those helpers (at most one copy of each). Useful especially if you bundle an application code.\n` +
				`  - "${EXTERNAL}" - use it only if you know what you are doing. It will reference helpers on **global** \`babelHelpers\` object. Used most commonly in combination with \`@babel/plugin-external-helpers\`.\n` +
				`  - "${INLINE}" - this is not recommended. Helpers will be inserted in each file using them, this can cause serious code duplication (this is default Babel behaviour)\n`,
		);
	}
	return unpackOptions({
		...rest,
		skipPreflightCheck,
		babelHelpers: rest.babelHelpers || BUNDLED,
		caller: {
			supportsStaticESM: true,
			supportsDynamicImport: true,
			supportsTopLevelAwait: true,
			...rest.caller,
		},
	});
};

const unpackOutputPluginOptions = (options, { format }) =>
	unpackOptions({
		configFile: false,
		sourceType: format === 'es' ? 'module' : 'script',
		...options,
		caller: {
			supportsStaticESM: format === 'es',
			...options.caller,
		},
	});

function getOptionsWithOverrides(pluginOptions = {}, overrides = {}) {
	if (!overrides.options) return { customOptions: null, pluginOptionsWithOverrides: pluginOptions };
	const overridden = overrides.options(pluginOptions);

	if (typeof overridden.then === 'function') {
		throw new Error(
			".options hook can't be asynchronous. It should return `{ customOptions, pluginsOptions }` synchronously.",
		);
	}

	return {
		customOptions: overridden.customOptions || null,
		pluginOptionsWithOverrides: overridden.pluginOptions || pluginOptions,
	};
}

const returnObject = () => ({});

function createBabelInputPluginFactory(customCallback = returnObject) {
	const overrides = customCallback(babel);

	return pluginOptions => {
		const { customOptions, pluginOptionsWithOverrides } = getOptionsWithOverrides(pluginOptions, overrides);

		const {
			exclude,
			extensions,
			babelHelpers,
			include,
			skipPreflightCheck,
			...babelOptions
		} = unpackInputPluginOptions(pluginOptionsWithOverrides);

		const extensionRegExp = new RegExp(`(${extensions.map(escapeRegExpCharacters).join('|')})$`);
		const includeExcludeFilter = createFilter(include, exclude);
		const filter = id => extensionRegExp.test(id) && includeExcludeFilter(id);

		return {
			name: 'babel',

			resolveId(id) {
				if (id === HELPERS) return id;
			},

			load(id) {
				if (id === HELPERS) return babel.buildExternalHelpers(null, 'module');
			},

			transform(code, filename) {
				if (!filter(filename)) return null;
				if (filename === HELPERS) return null;

				return transformCode(
					code,
					{ ...babelOptions, filename },
					overrides,
					customOptions,
					this,
					async transformOptions => {
						if (!skipPreflightCheck) {
							await preflightCheck(this, babelHelpers, transformOptions);
						}

						if (babelHelpers === BUNDLED) {
							transformOptions = addBabelPlugin(transformOptions, bundledHelpersPlugin);
						}

						return transformOptions;
					},
				);
			},
		};
	};
}

function getRecommendedFormat(rollupFormat) {
	switch (rollupFormat) {
		case 'amd':
			return 'amd';
		case 'iife':
		case 'umd':
			return 'umd';
		case 'system':
			return 'systemjs';
		default:
			return '<module format>';
	}
}

function createBabelOutputPluginFactory(customCallback = returnObject) {
	const overrides = customCallback(babel);

	return pluginOptions => {
		const { customOptions, pluginOptionsWithOverrides } = getOptionsWithOverrides(pluginOptions, overrides);

		return {
			name: 'babel',

			renderStart(outputOptions) {
				const { extensions, include, exclude, allowAllFormats } = pluginOptionsWithOverrides;

				if (extensions || include || exclude) {
					warnOnce(this, 'The "include", "exclude" and "extensions" options are ignored when transforming the output.');
				}
				if (!allowAllFormats && outputOptions.format !== 'es' && outputOptions.format !== 'cjs') {
					this.error(
						`Using Babel on the generated chunks is strongly discouraged for formats other than "esm" or "cjs" as it can easily break wrapper code and lead to accidentally created global variables. Instead, you should set "output.format" to "esm" and use Babel to transform to another format, e.g. by adding "presets: [['@babel/env', { modules: '${getRecommendedFormat(
							outputOptions.format,
						)}' }]]" to your Babel options. If you still want to proceed, add "allowAllFormats: true" to your plugin options.`,
					);
				}
			},

			renderChunk(code, chunk, outputOptions) {
				/* eslint-disable no-unused-vars */
				const {
					allowAllFormats,
					exclude,
					extensions,
					externalHelpers,
					externalHelpersWhitelist,
					include,
					runtimeHelpers,
					...babelOptions
				} = unpackOutputPluginOptions(pluginOptionsWithOverrides, outputOptions);
				/* eslint-enable no-unused-vars */

				return transformCode(code, babelOptions, overrides, customOptions, this);
			},
		};
	};
}

const babelPluginFactory = createBabelInputPluginFactory();
babelPluginFactory.custom = createBabelInputPluginFactory;
babelPluginFactory.generated = createBabelOutputPluginFactory();
babelPluginFactory.generated.custom = createBabelOutputPluginFactory;

export default babelPluginFactory;
