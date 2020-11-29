import { FilterPattern } from '@rollup/pluginutils';
import { Plugin } from 'rollup';
import { ESLint } from 'eslint';

export interface RollupEslintOptions extends ESLint.Options {
  /**
   * Controls whether or not to throw an error and exit the
   * process when ESLint reports any errors.
   * @default false
   */
  throwOnError?: boolean;

  /**
   * Controls whether or not to throw an error and exit the
   * process when ESLint reports any warnings.
   * @default false
   */
  throwOnWarning?: boolean;

  /**
   * A single picomatch pattern or an array of patterns controlling
   * which files this plugin should include.
   * @default undefined
   */
  include?: FilterPattern;

  /**
   * A single picomatch pattern or an array of patterns controlling
   * which files this plugin should exclude.
   * @default 'node_modules/**'
   */
  exclude?: FilterPattern;

  /**
   * The name of a (built-in) formatter or the path to a custom formatter.
   * @default 'stylish'
   */
  formatter?: string;
}

/**
 * 🍣 A Rollup plugin for verifing entry points and all imported files with ESLint.
 */
export default function eslint(options?: RollupEslintOptions): Plugin;
