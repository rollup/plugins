#!/usr/bin/env node

/* eslint-disable  import/no-extraneous-dependencies */

const { existsSync } = require('fs');
const { join } = require('path');

const chalk = require('chalk');
const execa = require('execa');

const [, , task] = process.argv;
const { stderr, stdout } = process;
const { log } = console;

(async () => {
  const rePkg = /(packages\/([\w\-_]+))\/?/;
  const { stdout: diff } = await execa('git', ['diff', 'master...HEAD', '--name-only']);
  const filters = diff
    .split('\n')
    .filter((line) => rePkg.test(line) && existsSync(join(__dirname, '..', line)))
    .map((line) => {
      const [, directory] = line.match(rePkg);
      return `--filter ./${directory}`;
    });

  if (filters.length) {
    const unique = Array.from(new Set(filters));

    log(chalk`{blue Executing \`${task}\`} for:\n  ${unique.join('\n  ')}`);

    const args = ['recursive', 'run', task].concat(unique);
    await execa('pnpm', args, { stdout, stderr });
  } else {
    log(chalk`{yellow No package changes detected, nothing run}`);
  }
})();
