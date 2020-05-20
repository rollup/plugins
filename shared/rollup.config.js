import { builtinModules } from 'module';

/**
 * Create a base rollup config
 * @param {*} pkg Imported package.json
 * @returns {import('rollup').RollupOptions}
 */
export function createConfig(pkg) {
  return {
    input: 'src/index.ts',
    external: Object.keys(pkg.dependencies || {}).concat(builtinModules),
    output: [
      {
        format: 'cjs',
        file: pkg.main,
        exports: 'named',
        footer: 'module.exports = Object.assign(exports.default, exports);'
      },
      {
        format: 'esm',
        file: pkg.module
      }
    ]
  };
}
