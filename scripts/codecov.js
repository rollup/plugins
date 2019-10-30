/* eslint-disable import/no-extraneous-dependencies */

const { readFileSync } = require('fs');
const { join } = require('path');

const chalk = require('chalk');
const { default: codecov } = require('codecov-lite');
const globby = require('globby');

const { log } = console;
const root = join(__dirname, '..');

(async () => {
  const files = await globby(['packages/*/coverage.lcov'], {
    cwd: root,
    onlyFiles: false
  });

  log(chalk.blue('Submitting Coverage to CodeCov.io'));
  log('Found Coverage Files:');
  log(' ', chalk.grey(files.join('\n  ')), '\n');

  for (const file of files) {
    try {
      const lcovData = readFileSync(join(root, file), 'utf8');
      await codecov(lcovData); // eslint-disable-line no-await-in-loop
      log(chalk.green('Coverage Submitted:'), file.replace(root, ''));
    } catch (e) {
      log(chalk.red('Coverage Failure:'), file.replace(root, ''));
      log(e.stack);
    }
  }
})();
