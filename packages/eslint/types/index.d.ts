import { Plugin } from 'rollup';
import { CLIEngine } from 'eslint';

export interface RollupEslintOptions extends CLIEngine.Options {
  /**
   * If true, will auto fix source code.
   * @default false
   */
  fix?: boolean;

  /**
   * If true, will throw an error if any errors were found.
   * @default false
   */
  throwOnError?: boolean;

  /**
   * If true, will throw an error if any warnings were found.
   * @default false
   */
  throwOnWarning?: boolean;

  /**
   * A single file, or array of files, to include when linting.
   * @default []
   */
  include?: string[] | string;

  /**
   * A single file, or array of files, to exclude when linting.
   * @default node_modules/**
   */
  exclude?: string[] | string;

  /**
   * Custom error formatter or the name of a built-in formatter.
   * @default stylish
   */
  formatter?: CLIEngine.Formatter | string;
}

/**
 * 🍣 A Rollup plugin for verifing entry points and all imported files with ESLint.
 */
export default function eslint(options?: RollupEslintOptions | string): Plugin;
