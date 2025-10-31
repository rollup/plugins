import fs from 'node:fs';
import path from 'node:path';
import { builtinModules } from 'node:module';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

import type { Plugin } from 'rollup';

type PackageManager = 'npm' | 'yarn' | 'pnpm';

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
   * If not specified, the plugin will default to `yarn` if `yarn.lock` exists,
   * to `pnpm` if `pnpm-lock.yaml` exists, or `npm` otherwise.
   */
  manager?: PackageManager;

  /**
   * Test-only override of package manager commands.
   * @internal
   */
  commands?: Partial<Record<PackageManager, string>>;
}

const execAsync = promisify(exec);

export default function autoInstall(opts: RollupAutoInstallOptions = {}): Plugin {
  // Restore the historic `defaults` object (including `commands`) so tests can
  // optionally override command strings via options.
  const defaults = {
    // intentionally undocumented options. used for tests
    commands: {
      npm: 'npm install',
      pnpm: 'pnpm add',
      yarn: 'yarn add'
    } as Record<PackageManager, string>,
    manager: fs.existsSync('yarn.lock') ? 'yarn' : fs.existsSync('pnpm-lock.yaml') ? 'pnpm' : 'npm',
    pkgFile: 'package.json'
  } as const;

  // Shallow-merge, with a one-level deep merge for `commands` to allow partial overrides in tests
  const options = {
    ...defaults,
    ...opts,
    commands: { ...defaults.commands, ...(opts.commands || {}) }
  };

  const { manager } = options;
  const pkgFile = path.resolve(options.pkgFile);

  const validManagers = Object.keys(options.commands) as PackageManager[];

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

  // Normalize core module names to include both `fs` and `node:fs` forms so we never try to
  // install built-ins regardless of how Rollup reports them or how they are imported.
  const coreModules = new Set<string>([
    ...builtinModules,
    ...builtinModules.filter((m) => m.startsWith('node:')).map((m) => m.slice(5)),
    ...builtinModules.filter((m) => !m.startsWith('node:')).map((m) => `node:${m}`)
  ]);

  const installed = new Set([...Object.keys(pkg.dependencies || {}), ...coreModules]);
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
