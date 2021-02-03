import { PluginContext } from 'rollup';
import { ModuleKind } from 'typescript';

import { TypeScriptConfig } from './options/tsconfig';

const moduleError = `
Rollup requires that TypeScript produces ES Modules. Unfortunately your configuration specifies a
 "module" other than "esnext". Unless you know what you're doing, please change "module" to "esnext"
 in the target tsconfig.json file or plugin options.`.replace(/\n/g, '');

// eslint-disable-next-line import/prefer-default-export
export const preflight = (config: TypeScriptConfig, context: PluginContext) => {
  let undef;
  if (![ModuleKind.ESNext, ModuleKind.ES2020, undef].includes(config.options.module)) {
    context.warn(`@rollup/plugin-typescript: ${moduleError}`);
  }
};
