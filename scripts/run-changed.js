#!/usr/bin/env node

/* eslint-disable  import/no-extraneous-dependencies */

const { existsSync } = require('fs');
const { join } = require('path');

const chalk = require('chalk');
const execa = require('execa');

const [, , task] = process.argv;
const { log } = console;
const sha = process.env.CIRCLE_SHA1 || 'HEAD';

(async () => {
  const rePkg = /(packages\/([\w\-_]+))\/?/;
  const { stdout: diff } = await execa('git', ['diff', `master...${sha}`, '--name-only']);
  const filters = diff
    .split('\n')
    .filter((line) => rePkg.test(line) && existsSync(join(__dirname, '..', line)))
    .map((line) => {
      const [, directory] = line.match(rePkg);
      return `--filter ./${directory}`;
    });
  const uniqueFilters = filters.length ? Array.from(new Set(filters)) : ['--filter ./packages'];

  if (!filters.length) {
    log(chalk`{yellow No individual package changes detected}`);
  }

  log(chalk`{blue Executing \`${task}\`} for:\n  ${uniqueFilters.join('\n  ')}\n`);

  const command = `pnpm run ${task} ${uniqueFilters.join(' ')}`;

  try {
    const res = await execa.command(command, { stdio: 'inherit' });
    log(res);
  } catch (e) {
    log(e);
    process.exit(e.exitCode);
  }
})();
