#!/usr/bin/env node

/* eslint-disable  import/no-extraneous-dependencies, import/no-dynamic-require, no-await-in-loop, global-require  */

const { join } = require('path');

const chalk = require('chalk');
const execa = require('execa');

const [, , ...plugins] = process.argv;
const packagesPath = join(__dirname, '..', 'packages');
const { log } = console;

(async () => {
  for (const pluginName of plugins) {
    log(chalk`{blue Publishing \`${pluginName}\`} from {grey packages/${pluginName}}\n`);

    const cwd = join(packagesPath, pluginName);
    const pkg = require(join(cwd, 'package.json'));

    await execa('pnpm', ['publish'], { cwd, stdio: 'inherit' });

    const tagName = `${pluginName}-v${pkg.version}`;
    log(chalk`\n{blue Tagging} {grey ${tagName}}`);
    await execa('git', ['tag', tagName], { cwd, stdio: 'inherit' });

    log(chalk`{blue Pushing Tags}`);
    await execa('git', ['push', '--tags']);
  }
})();
