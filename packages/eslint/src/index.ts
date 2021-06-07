import { relative } from 'path';

import { ESLint } from 'eslint';
import { createFilter } from '@rollup/pluginutils';

import { RollupEslintOptions } from '../types';

export default (options: RollupEslintOptions = {}) => {
  const {
    include,
    exclude = 'node_modules/**',
    throwOnWarning = false,
    throwOnError = false,
    formatter = 'stylish',
    ...eslintOptions
  } = options;

  const filter = createFilter(include, exclude);
  const eslint = new ESLint(eslintOptions);

  return {
    name: 'eslint',
    async load(id: string) {
      if (filter(id)) {
        const results = await eslint.lintFiles(id);
        const [result] = results;

        if (eslintOptions.fix) {
          await ESLint.outputFixes(results);
        }

        const eslintFormatter = await eslint.loadFormatter(formatter);
        const output = eslintFormatter.format(results);

        if (output.length > 0) {
          // eslint-disable-next-line no-console
          console.log(output);
        }

        if (result.warningCount > 0 && throwOnWarning) {
          throw new Error(
            `Found ${result.warningCount} warning(s) in ${relative('.', result.filePath)}!`
          );
        }

        if (result.errorCount > 0 && throwOnError) {
          throw new Error(
            `Found ${result.errorCount} error(s) in ${relative('.', result.filePath)}!`
          );
        }

        return result.output || null;
      }

      return null;
    }
  };
};
