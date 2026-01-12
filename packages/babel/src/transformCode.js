import * as babel from '@babel/core';

import bundledHelpersPlugin from './bundledHelpersPlugin.js';
import preflightCheck from './preflightCheck.js';
import { BUNDLED } from './constants.js';
import { addBabelPlugin } from './utils.js';

export default async function transformCode({
  inputCode,
  babelOptions,
  overrides,
  customOptions,
  error,
  runPreflightCheck,
  babelHelpers
}) {
  // loadPartialConfigAsync has become available in @babel/core@7.8.0
  const config = await (babel.loadPartialConfigAsync || babel.loadPartialConfig)(babelOptions);

  // file is ignored by babel
  if (!config) {
    return null;
  }

  let transformOptions = !overrides?.config
    ? config.options
    : await overrides.config(config, {
        code: inputCode,
        customOptions
      });

  if (runPreflightCheck) {
    await preflightCheck(error, babelHelpers, transformOptions);
  }

  transformOptions =
    babelHelpers === BUNDLED
      ? addBabelPlugin(transformOptions, bundledHelpersPlugin)
      : transformOptions;

  if (!overrides?.result) {
    const { code, map } = await babel.transformAsync(inputCode, transformOptions);
    return {
      code,
      map
    };
  }

  const result = await babel.transformAsync(inputCode, transformOptions);
  const { code, map } = await overrides.result(result, {
    code: inputCode,
    customOptions,
    config,
    transformOptions
  });
  return {
    code,
    map
  };
}
