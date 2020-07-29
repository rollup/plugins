import * as babel from '@babel/core';
import { VERSION } from "rollup";
import { createFilter } from '@rollup/pluginutils';

import { BUNDLED, HELPERS } from './constants';
import bundledHelpersPlugin from './bundledHelpersPlugin';
import preflightCheck from './preflightCheck';
import transformCode from './transformCode';
import { addBabelPlugin, escapeRegExpCharacters, warnOnce } from './utils';

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

const unpackInputPluginOptions = ({ skipPreflightCheck = false, ...rest }) => {
  if (!rest.babelHelpers) {
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
      // todo: remove version checks for 1.20 - 1.25 when we bump peer deps
      supportsExportNamespaceFrom: !VERSION.match(/^1\.2[0-5]\./),
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
      skipPreflightCheck,
      ...babelOptions
    } = unpackInputPluginOptions(pluginOptionsWithOverrides);

    const extensionRegExp = new RegExp(`(${extensions.map(escapeRegExpCharacters).join('|')})$`);
    const includeExcludeFilter = createFilter(include, exclude);
    const filter = (id) => extensionRegExp.test(id) && includeExcludeFilter(id);

    return {
      name: 'babel',

      resolveId(id) {
        if (id !== HELPERS) {
          return null;
        }
        return id;
      },

      load(id) {
        if (id !== HELPERS) {
          return null;
        }
        return babel.buildExternalHelpers(null, 'module');
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
