import { PluginContext } from 'rollup';
import { ModuleKind } from 'typescript';

import { TypeScriptConfig } from './options/tsconfig';

const moduleError = `
Rollup requires that TypeScript produces ES Modules. Unfortunately your configuration specifies a
 "module" other than "esnext". Unless you know what you're doing, please change "module" to "esnext"
 in the target tsconfig.json file or plugin options.`.replace(/\n/g, '');

let undef;
const validModules = [ModuleKind.ES2015, ModuleKind.ES2020, ModuleKind.ESNext, undef];

// eslint-disable-next-line import/prefer-default-export
export const preflight = (config: TypeScriptConfig, context: PluginContext) => {
  if (!validModules.includes(config.options.module)) {
    context.warn(`@rollup/plugin-typescript: ${moduleError}`);
  }
};
