#!/usr/bin/env node

/* eslint-disable  import/no-extraneous-dependencies */

const { existsSync, readFileSync } = require('fs');
const { join, sep } = require('path');

const chalk = require('chalk');
const execa = require('execa');
const yaml = require('yaml');

const [, , task] = process.argv;
const { log } = console;

const getDiff = async () => {
  const {
    CIRCLE_BRANCH,
    CIRCLE_SHA1,
    CIRCLE_COMPARE_URL,
    GITHUB_SHA,
    GITHUB_BASE_REF
  } = process.env;
  let baseRef = 'master';
  let range = 'HEAD';

  if (CIRCLE_SHA1) {
    if (CIRCLE_BRANCH === 'master' && CIRCLE_COMPARE_URL) {
      const reCompare = /compare\/([0-9a-z]+)\.\.\.([0-9a-z]+)$/;
      const [, from] = CIRCLE_COMPARE_URL.match(reCompare);
      baseRef = from || 'master';
    }
    range = `${baseRef}...${CIRCLE_SHA1}`;
  }

  if (GITHUB_SHA) {
    baseRef = GITHUB_BASE_REF || 'master';
    range = `${baseRef}...${GITHUB_SHA}`;
  }

  log(chalk`{blue Comparing ${range}}`);

  const { stdout } = await execa('git', ['diff', range, '--name-only']);
  return stdout;
};

(async () => {
  const workspace = readFileSync(join(__dirname, '..', 'pnpm-workspace.yaml'), 'utf-8');
  const { packages } = yaml.parse(workspace);
  const roots = packages.map((item) => item.split(sep)[0]).join('|');
  const rePkg = new RegExp(`(${roots}/([\\w\\-_]+))/?`);
  const diff = await getDiff();
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
