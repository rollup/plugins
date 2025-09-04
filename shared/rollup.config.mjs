// @ts-check
import { builtinModules } from 'module';
import fs from 'node:fs/promises';

// eslint-disable-next-line import/no-extraneous-dependencies
import typescript from '@rollup/plugin-typescript';

/**
 * Create a base rollup config
 * @param {Object} param
 * @param {Record<string,any>} param.pkg Imported package.json
 * @param {string[]} [param.external] Dependencies that should remain external
 * @returns {import('rollup').RollupOptions}
 */
export function createConfig({ pkg, external = [] }) {
  return {
    input: 'src/index.ts',
    external: Object.keys(pkg.dependencies || {})
      .concat(Object.keys(pkg.peerDependencies || {}))
      .concat(builtinModules)
      .concat(external),
    onwarn: (warning) => {
      throw Object.assign(new Error(), warning);
    },
    strictDeprecations: true,
    output: [
      {
        format: 'cjs',
        file: pkg.main,
        exports: 'named',
        footer: 'module.exports = Object.assign(exports.default, exports);',
        plugins: emitCjsTypings(),
        sourcemap: true
      },
      {
        format: 'es',
        file: pkg.module,
        plugins: emitEsmTypings(),
        sourcemap: true
      }
    ],
    plugins: [typescript({ sourceMap: true })]
  };
}

/**
 * @returns {Array<import('rollup').OutputPlugin>}
 */
export function emitCjsTypings() {
  return [
    {
      name: 'emit-cjs-types',
      async generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: `index.d.ts`,
          source: await fs.readFile('./types/index.d.ts')
        });
      }
    },
    emitPackageFile('commonjs')
  ];
}

/**
 * @returns {Array<import('rollup').OutputPlugin>}
 */
function emitEsmTypings() {
  return [
    {
      name: 'emit-esm-declaration-file',
      async generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: `index.d.ts`,
          source: await fs.readFile('./types/index.d.ts')
        });
      }
    },
    emitPackageFile('module')
  ];
}

/**
 * @param {'module' | 'commonjs'} type
 * @returns {import('rollup').Plugin}
 */
function emitPackageFile(type) {
  return {
    name: 'emit-package-file',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'package.json',
        source: `{"type":"${type}"}`
      });
    }
  };
}
