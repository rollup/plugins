import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const EARLIEST_SUFFIX = '-earliest';

export function getEarliestDependencies() {
  const packageJsonPath = join(process.cwd(), 'package.json');
  const { devDependencies = {} } = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  const dependencies = Object.keys(devDependencies)
    .filter((name) => name.endsWith(EARLIEST_SUFFIX))
    .map((name) => ({
      name: name.slice(0, -EARLIEST_SUFFIX.length),
      path: join(process.cwd(), 'node_modules', name)
    }));
  if (!dependencies.some(({ name }) => name === 'rollup')) {
    throw new Error(`Missing "rollup-earliest" devDependency in ${packageJsonPath}.`);
  }
  for (const { path } of dependencies) {
    if (!existsSync(path)) {
      throw new Error(
        `Missing "${path}". Run "pnpm install" to test against the earliest supported versions.`
      );
    }
  }
  return dependencies;
}
