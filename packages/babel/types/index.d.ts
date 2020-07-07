import { Plugin } from 'rollup';
import { FilterPattern } from '@rollup/pluginutils';
import * as babelCore from '@babel/core';

export interface RollupBabelInputPluginOptions
  extends Omit<babelCore.TransformOptions, 'include' | 'exclude'> {
  /**
   * A minimatch pattern, or array of patterns, which specifies the files in the build the plugin should operate on. When relying on Babel configuration files you cannot include files already excluded there.
   * @default undefined;
   */
  include?: FilterPattern;
  /**
   * A minimatch pattern, or array of patterns, which specifies the files in the build the plugin should ignore. When relaying on Babel configuration files you can only exclude additional files with this option, you cannot override what you have configured for Babel itself.
   * @default undefined;
   */
  exclude?: FilterPattern;
  /**
   * An array of file extensions that Babel should transpile. If you want to transpile TypeScript files with this plugin it's essential to include .ts and .tsx in this option.
   * @default ['.js', '.jsx', '.es6', '.es', '.mjs']
   */
  extensions?: string[];
  /**
   * It is recommended to configure this option explicitly (even if with its default value) so an informed decision is taken on how those babel helpers are inserted into the code.
   * @default 'bundled'
   */
  babelHelpers?: 'bundled' | 'runtime' | 'inline' | 'external';
  /**
   * Before transpiling your input files this plugin also transpile a short piece of code for each input file. This is used to validate some misconfiguration errors, but for sufficiently big projects it can slow your build times so if you are confident about your configuration then you might disable those checks with this option.
   * @default false
   */
  skipPreflightCheck?: boolean;
}

export interface RollupBabelOutputPluginOptions
  extends Omit<babelCore.TransformOptions, 'include' | 'exclude'> {
  /**
   * Use with other formats than UMD/IIFE.
   * @default false
   */
  allowAllFormats?: boolean;
}

export type RollupBabelCustomInputPluginOptions = (
  options: RollupBabelInputPluginOptions & Record<string, any>
) => {
  customOptions: Record<string, any>;
  pluginOptions: RollupBabelInputPluginOptions;
};
export type RollupBabelCustomOutputPluginOptions = (
  options: RollupBabelOutputPluginOptions & Record<string, any>
) => {
  customOptions: Record<string, any>;
  pluginOptions: RollupBabelOutputPluginOptions;
};
export type RollupBabelCustomPluginConfig = (
  cfg: babelCore.PartialConfig,
  options: { code: string; customOptions: Record<string, any> }
) => babelCore.TransformOptions;
export type RollupBabelCustomPluginResult = (
  result: babelCore.BabelFileResult,
  options: {
    code: string;
    customOptions: Record<string, any>;
    config: babelCore.PartialConfig;
    transformOptions: babelCore.TransformOptions;
  }
) => babelCore.BabelFileResult;
export interface RollupBabelCustomInputPlugin {
  options?: RollupBabelCustomInputPluginOptions;
  config?: RollupBabelCustomPluginConfig;
  result?: RollupBabelCustomPluginResult;
}
export interface RollupBabelCustomOutputPlugin {
  options?: RollupBabelCustomOutputPluginOptions;
  config?: RollupBabelCustomPluginConfig;
  result?: RollupBabelCustomPluginResult;
}
export type RollupBabelCustomInputPluginBuilder = (
  babel: typeof babelCore
) => RollupBabelCustomInputPlugin;
export type RollupBabelCustomOutputPluginBuilder = (
  babel: typeof babelCore
) => RollupBabelCustomOutputPlugin;

/**
 * A Rollup plugin for seamless integration between Rollup and Babel.
 * @param options - Plugin options.
 * @returns Plugin instance.
 */
export function getBabelInputPlugin(options?: RollupBabelInputPluginOptions): Plugin;
export function getBabelOutputPlugin(options?: RollupBabelOutputPluginOptions): Plugin;

export function createBabelInputPluginFactory(
  customCallback?: RollupBabelCustomInputPluginBuilder
): typeof getBabelInputPlugin;
export function createBabelOutputPluginFactory(
  customCallback?: RollupBabelCustomOutputPluginBuilder
): typeof getBabelOutputPlugin;

/**
 * A Rollup plugin for seamless integration between Rollup and Babel.
 * @param options - Plugin options.
 * @returns Plugin instance.
 */
export function babel(options?: RollupBabelInputPluginOptions): Plugin;
export default babel;
