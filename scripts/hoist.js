const { existsSync } = require('fs');
const { readlink, symlink, unlink } = require('fs').promises;
const { join } = require('path');

const chalk = require('chalk');

const { hoist } = require('../package.json');

const { log } = console;
const nodeModules = join(__dirname, '../node_modules');

(async () => {
  const packages = Object.keys(hoist);

  for (const parentName of packages) {
    const parentLinkPath = join(nodeModules, parentName);
    const parentLinkTarget = await readlink(parentLinkPath);
    const linkBase = join(nodeModules, parentLinkTarget, '..');

    for (const hoistPkg of hoist[parentName]) {
      const linkTarget = join(linkBase, hoistPkg);
      const linkPath = join(nodeModules, hoistPkg);

      if (existsSync(linkPath)) {
        log(linkPath, 'exists');
        await unlink(linkPath);
      }

      await symlink(linkTarget, linkPath);

      log(chalk`{blue Hosting Package}: ${hoistPkg}`);
    }
  }
})();
