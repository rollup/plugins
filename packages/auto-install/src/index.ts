import fs from 'node:fs';
import path from 'node:path';
import { builtinModules } from 'node:module';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

import type { Plugin } from 'rollup';

type PackageManager = 'npm' | 'pnpm' | 'yarn';

type Commands = Record<PackageManager, string>;

export interface RollupAutoInstallOptions {
  /**
   * Specifies the location on disk of the target `package.json` file.
   * If the file doesn't exist, it will be created by the plugin,
   * as package managers need to populate the `dependencies` property.
   * @default '{cwd}/package.json'
   */
  pkgFile?: string;

  /**
   * Specifies the package manager to use.
   * If not specified, the plugin will default to:
   * - `'yarn'` if `yarn.lock` exists
   * - `'pnpm'` if `pnpm-lock.yaml` exists
   * - `'npm'` otherwise
   */
  manager?: PackageManager;

  /**
   * Intentionally undocumented options. Used for tests.
   */
  commands?: Partial<Commands>;
}

const execAsync = promisify(exec);

export default function autoInstall(opts: RollupAutoInstallOptions = {}): Plugin {
  const manager =
    opts.manager ??
    (fs.existsSync('yarn.lock') ? 'yarn' : fs.existsSync('pnpm-lock.yaml') ? 'pnpm' : 'npm');

  const pkgFile = path.resolve(opts.pkgFile ?? 'package.json');

  const validManagers: readonly PackageManager[] = ['npm', 'yarn', 'pnpm'];

  if (!validManagers.includes(manager)) {
    throw new RangeError(
      `'${manager}' is not a valid package manager. ` +
        `Valid managers include: '${validManagers.join("', '")}'.`
    );
  }

  const commands: Commands = {
    npm: 'npm install',
    pnpm: 'pnpm install',
    yarn: 'yarn add',
    ...opts.commands
  };

  let pkg: any;
  if (fs.existsSync(pkgFile)) {
    pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf-8'));
  } else {
    fs.writeFileSync(pkgFile, '{}');
    pkg = {};
  }

  const installed = new Set([...Object.keys(pkg.dependencies || {}), ...builtinModules]);
  const cmd = commands[manager];

  return {
    name: 'auto-install',

    async resolveId(importee, importer) {
      // entry module
      if (!importer) return null;

      // this function doesn't actually resolve anything, but it provides us with a hook to discover uninstalled deps

      const isExternalPackage =
        importee[0] !== '.' && importee[0] !== '\\0' && !path.isAbsolute(importee);

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
