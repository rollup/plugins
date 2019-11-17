const fs = require('fs');
const path = require('path');
const child_process = require('child_process'); // eslint-disable-line camelcase
const { builtinModules } = require('module');

const { log } = console;

function exec(cmd) {
  return new Promise((fulfil, reject) => {
    child_process.exec(cmd, (err) => {
      if (err) reject(err);
      else fulfil();
    });
  });
}

module.exports = function autoInstall(opts = {}) {
  const defaults = {
    manager: fs.existsSync('yarn.lock') ? 'yarn' : 'npm',
    pkgFile: path.resolve(opts.pkgFile || 'package.json')
  };

  const options = Object.assign({}, defaults, opts);
  const { manager, pkgFile } = options;
  const validManagers = ['npm', 'yarn'];
  const commands = {
    npm: 'npm install',
    yarn: 'yarn add'
  };
  let pkg;

  if (!validManagers.includes(manager)) {
    throw new RangeError(
      `'${manager}' is not a valid package manager. Valid managers include: '${validManagers.join(
        "', '"
      )}'.`
    );
  }

  if (fs.existsSync(pkgFile)) {
    pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf-8'));
  } else {
    fs.writeFileSync(pkgFile, '{}');
    pkg = {};
  }

  const installed = new Set(Object.keys(pkg.dependencies || {}).concat(builtinModules));
  const cmd = commands[manager];

  return {
    name: 'auto-install',

    async resolveId(importee, importer) {
      // entry module
      if (!importer) return;

      // this function doesn't actually resolve anything, but it provides us with a hook to discover uninstalled deps

      const isExternalPackage =
        importee[0] !== '.' && importee[0] !== '\0' && !path.isAbsolute(importee);

      if (isExternalPackage) {
        // we have a bare import — check it's installed
        const parts = importee.split('/');
        let name = parts.shift();
        if (name[0] === '@') name += `/${parts.shift()}`;

        if (!installed.has(name)) {
          log(`installing ${name}...`);
          await exec(`${cmd} ${name}`);
        }
      }
    }
  };
};
