import * as fs from 'fs';
import * as path from 'path';
import mod from 'module';
import { exec } from 'child_process';
import { promisify } from 'util';

import { Plugin } from 'rollup';

import { RollupAutoInstallOptions } from '../types';

const execAsync = promisify(exec);

export default function autoInstall(opts: RollupAutoInstallOptions = {}): Plugin {
  const defaults = {
    // intentionally undocumented options. used for tests
    commands: {
      npm: 'npm install',
      pnpm: 'pnpm install',
      yarn: 'yarn add'
    },
    manager: fs.existsSync('yarn.lock') ? 'yarn' : fs.existsSync('pnpm-lock.yaml') ? 'pnpm' : 'npm',
    pkgFile: path.resolve(opts.pkgFile || 'package.json')
  };

  const options = Object.assign({}, defaults, opts);
  const { manager, pkgFile } = options;
  const validManagers = ['npm', 'yarn', 'pnpm'];

  if (!validManagers.includes(manager)) {
    throw new RangeError(
      `'${manager}' is not a valid package manager. ` +
        `Valid managers include: '${validManagers.join("', '")}'.`
    );
  }

  let pkg: any;
  if (fs.existsSync(pkgFile)) {
    pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf-8'));
  } else {
    fs.writeFileSync(pkgFile, '{}');
    pkg = {};
  }

  const installed = new Set(Object.keys(pkg.dependencies || {}).concat(mod.builtinModules));
  const cmd = options.commands[manager];

  return {
    name: 'auto-install',

    async resolveId(importee, importer) {
      // entry module
      if (!importer) return null;

      // this function doesn't actually resolve anything, but it provides us with a hook to discover uninstalled deps

      const isExternalPackage =
        importee[0] !== '.' && importee[0] !== '\0' && !path.isAbsolute(importee);

      if (isExternalPackage) {
        // we have a bare import — check it's installed
        const parts = importee.split('/');
        let name = parts.shift()!;
        if (name[0] === '@') name += `/${parts.shift()}`;

        if (!installed.has(name)) {
          // eslint-disable-next-line no-console
          console.log(`installing ${name}...`);
          await execAsync(`${cmd} ${name}`);
        }
      }

      return null;
    }
  };
}
