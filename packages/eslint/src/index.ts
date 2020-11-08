import * as path from 'path';

import { Plugin } from 'rollup';
import { createFilter } from 'rollup-pluginutils';
import { CLIEngine } from 'eslint';

import { RollupEslintOptions } from '../types';

function normalizePath(id: string) {
  return path
    .relative(process.cwd(), id)
    .split(path.sep)
    .join('/');
}

export default function eslint(options = {} as RollupEslintOptions): Plugin {
  if (typeof options === 'string') {
    const configFile = path.resolve(process.cwd(), options);
    // eslint-disable-next-line global-require, import/no-dynamic-require, no-param-reassign
    options = require(configFile);
    // Tell eslint not to look for configuration files.
    // eslint-disable-next-line no-param-reassign
    options.useEslintrc = false;
  }

  const cli = new CLIEngine(options);
  let formatter: CLIEngine.Formatter;

  switch (typeof options.formatter) {
    case 'string':
      formatter = cli.getFormatter(options.formatter);
      break;
    case 'function':
      ({ formatter } = options);
      break;
    default:
      formatter = cli.getFormatter('stylish');
  }

  const filter = createFilter(options.include, options.exclude || /node_modules/);

  return {
    name: 'eslint',

    // eslint-disable-next-line consistent-return
    transform(code, id) {
      const file = normalizePath(id);
      if (!filter(id) || cli.isPathIgnored(file)) {
        return null;
      }

      const report = cli.executeOnText(code, file);
      const hasWarnings = options.throwOnWarning && report.warningCount !== 0;
      const hasErrors = options.throwOnError && report.errorCount !== 0;

      if (options.fix && report) {
        CLIEngine.outputFixes(report);
      }

      if (report.warningCount === 0 && report.errorCount === 0) {
        return null;
      }

      const result = formatter(report.results);

      if (result) {
        // eslint-disable-next-line no-console
        console.log(result);
      }

      if (hasWarnings && hasErrors) {
        throw Error('Warnings or errors were found');
      }

      if (hasWarnings) {
        throw Error('Warnings were found');
      }

      if (hasErrors) {
        throw Error('Errors were found');
      }
    }
  };
}
