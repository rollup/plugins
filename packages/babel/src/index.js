import * as babel from '@babel/core';
import { createFilter } from '@rollup/pluginutils';

import { BUNDLED, HELPERS } from './constants.js';
import bundledHelpersPlugin from './bundledHelpersPlugin.js';
import preflightCheck from './preflightCheck.js';
import transformCode from './transformCode.js';
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
} = {}) => {
  return {
    extensions,
    plugins: [],
    sourceMaps: sourcemap && sourcemaps && sourceMap && sourceMaps,
    ...rest,
    caller: {
      name: '@rollup/plugin-babel',
      ...rest.caller
    }
  };
};

const warnAboutDeprecatedHelpersOption = ({ deprecatedOption, suggestion }) => {
  // eslint-disable-next-line no-console
  console.warn(
    `\`${deprecatedOption}\` has been removed in favor a \`babelHelpers\` option. Try changing your configuration to \`${suggestion}\`. ` +
      `Refer to the documentation to learn more: https://github.com/rollup/plugins/tree/master/packages/babel#babelhelpers`
  );
};

const unpackInputPluginOptions = ({ skipPreflightCheck = false, ...rest }) => {
  if ('runtimeHelpers' in rest) {
    warnAboutDeprecatedHelpersOption({
      deprecatedOption: 'runtimeHelpers',
      suggestion: `babelHelpers: 'runtime'`
    });
  } else if ('externalHelpers' in rest) {
    warnAboutDeprecatedHelpersOption({
      deprecatedOption: 'externalHelpers',
      suggestion: `babelHelpers: 'external'`
    });
  } else if (!rest.babelHelpers) {
    // eslint-disable-next-line no-console
    console.warn(
      "babelHelpers: 'bundled' option was used by default. It is recommended to configure this option explicitly, read more here: " +
        'https://github.com/rollup/plugins/tree/master/packages/babel#babelhelpers'
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
      supportsExportNamespaceFrom: true,
      ...rest.caller
    }
  });
};

const unpackOutputPluginOptions = (options, { format }) =>
  unpackOptions({
    configFile: false,
    sourceType: format === 'es' ? 'module' : 'script',
    ...options,
    caller: {
      supportsStaticESM: format === 'es',
      ...options.caller
    }
  });

function getOptionsWithOverrides(pluginOptions = {}, overrides = {}) {
  if (!overrides.options) return { customOptions: null, pluginOptionsWithOverrides: pluginOptions };
  const overridden = overrides.options(pluginOptions);

  if (typeof overridden.then === 'function') {
    throw new Error(
      ".options hook can't be asynchronous. It should return `{ customOptions, pluginsOptions }` synchronously."
    );
  }

  return {
    customOptions: overridden.customOptions || null,
    pluginOptionsWithOverrides: overridden.pluginOptions || pluginOptions
  };
}

const returnObject = () => {
  return {};
};

function createBabelInputPluginFactory(customCallback = returnObject) {
  const overrides = customCallback(babel);

  return (pluginOptions) => {
    const { customOptions, pluginOptionsWithOverrides } = getOptionsWithOverrides(
      pluginOptions,
      overrides
    );

    const {
      exclude,
      extensions,
      babelHelpers,
      include,
      filter: customFilter,
      skipPreflightCheck,
      ...babelOptions
    } = unpackInputPluginOptions(pluginOptionsWithOverrides);

    const extensionRegExp = new RegExp(
      `(${extensions.map(escapeRegExpCharacters).join('|')})(\\?.*)?(#.*)?$`
    );
    if (customFilter && (include || exclude)) {
      throw new Error('Could not handle include or exclude with custom filter together');
    }
    const userDefinedFilter =
      typeof customFilter === 'function' ? customFilter : createFilter(include, exclude);
    const filter = (id, code) => extensionRegExp.test(id) && userDefinedFilter(id, code);

    const helpersFilter = { id: new RegExp(`^${escapeRegExpCharacters(HELPERS)}$`) };

    return {
      name: 'babel',

      resolveId: {
        filter: helpersFilter,
        handler(id) {
          if (id !== HELPERS) {
            return null;
          }
          return id;
        }
      },

      load: {
        filter: helpersFilter,
        handler(id) {
          if (id !== HELPERS) {
            return null;
          }
          return babel.buildExternalHelpers(null, 'module');
        }
      },

      transform: {
        filter: {
          id: extensionRegExp
        },
        async handler(code, filename) {
          if (!(await filter(filename, code))) return null;
          if (filename === HELPERS) return null;

          return transformCode(
            code,
            { ...babelOptions, filename },
            overrides,
            customOptions,
            this,
            async (transformOptions) => {
              if (!skipPreflightCheck) {
                await preflightCheck(this, babelHelpers, transformOptions);
              }

              return babelHelpers === BUNDLED
                ? addBabelPlugin(transformOptions, bundledHelpersPlugin)
                : transformOptions;
            }
          );
        }
      }
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

  return (pluginOptions) => {
    const { customOptions, pluginOptionsWithOverrides } = getOptionsWithOverrides(
      pluginOptions,
      overrides
    );

    // cache for chunk name filter (includeChunks/excludeChunks)
    let chunkNameFilter;

    return {
      name: 'babel',

      renderStart(outputOptions) {
        const { extensions, include, exclude, allowAllFormats } = pluginOptionsWithOverrides;

        if (extensions || include || exclude) {
          warnOnce(
            this,
            'The "include", "exclude" and "extensions" options are ignored when transforming the output.'
          );
        }
        if (!allowAllFormats && outputOptions.format !== 'es' && outputOptions.format !== 'cjs') {
          this.error(
            `Using Babel on the generated chunks is strongly discouraged for formats other than "esm" or "cjs" as it can easily break wrapper code and lead to accidentally created global variables. Instead, you should set "output.format" to "esm" and use Babel to transform to another format, e.g. by adding "presets: [['@babel/env', { modules: '${getRecommendedFormat(
              outputOptions.format
            )}' }]]" to your Babel options. If you still want to proceed, add "allowAllFormats: true" to your plugin options.`
          );
        }
      },

      renderChunk(code, chunk, outputOptions) {
        /* eslint-disable no-unused-vars */
        const {
          allowAllFormats,
          includeChunks,
          excludeChunks,
          exclude,
          extensions,
          externalHelpers,
          externalHelpersWhitelist,
          include,
          runtimeHelpers,
          ...babelOptions
        } = unpackOutputPluginOptions(pluginOptionsWithOverrides, outputOptions);
        /* eslint-enable no-unused-vars */
        // If includeChunks/excludeChunks are specified, filter by chunk.name
        if (includeChunks != null || excludeChunks != null) {
          if (!chunkNameFilter) {
            chunkNameFilter = createFilter(includeChunks, excludeChunks, { resolve: false });
          }
          if (!chunkNameFilter(chunk.name)) {
            // Skip transforming this chunk
            return null;
          }
        }

        return transformCode(code, babelOptions, overrides, customOptions, this);
      }
    };
  };
}

// export this for symmetry with output-related exports
export const getBabelInputPlugin = createBabelInputPluginFactory();
export const getBabelOutputPlugin = createBabelOutputPluginFactory();
export { createBabelInputPluginFactory, createBabelOutputPluginFactory };

export default getBabelInputPlugin;
// support `rollup -c —plugin babel`
export { getBabelInputPlugin as babel };
