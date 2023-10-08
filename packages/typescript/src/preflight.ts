import type { PluginContext } from 'rollup';
import typescript from 'typescript';

import type { TypeScriptConfig } from './options/tsconfig';
// import { resolveIdAsync } from './tslib';

const { ModuleKind } = typescript;
interface PreflightOptions {
  config: TypeScriptConfig;
  context: PluginContext;
  inputPreserveModules: boolean;
  tslib: any;
}

const pluginName = '@rollup/plugin-typescript';
const moduleErrorMessage = `
${pluginName}: Rollup requires that TypeScript produces ES Modules. Unfortunately your configuration specifies a
 "module" other than "esnext". Unless you know what you're doing, please change "module" to "esnext"
 in the target tsconfig.json file or plugin options.`.replace(/\n/g, '');

const tsLibErrorMessage = `${pluginName}: Could not find module 'tslib', which is required by this plugin. Is it installed?`;

let undef;
const validModules = [
  ModuleKind.ES2015,
  ModuleKind.ES2020,
  ModuleKind.ESNext,
  ModuleKind.Node16,
  ModuleKind.NodeNext,
  undef
];

// eslint-disable-next-line import/prefer-default-export
export const preflight = ({ config, context, inputPreserveModules, tslib }: PreflightOptions) => {
  if (!validModules.includes(config.options.module)) {
    context.warn(moduleErrorMessage);
  }

  if (!inputPreserveModules && tslib === null) {
    context.error(tsLibErrorMessage);
  }
};
