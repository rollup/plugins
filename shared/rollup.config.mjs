import { builtinModules } from 'module';
import { promises as fs } from 'fs';

// eslint-disable-next-line import/no-extraneous-dependencies
import typescript from '@rollup/plugin-typescript';

/**
 * Create a base rollup config
 * @param {Record<string,any>} pkg Imported package.json
 * @param {string[]} external Imported package.json
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
        plugins: [emitDeclarationFile()],
        sourcemap: true
      },
      {
        format: 'es',
        file: pkg.module,
        plugins: [emitModulePackageFile(), emitDeclarationFile()],
        sourcemap: true
      }
    ],
    plugins: [typescript({ sourceMap: true })]
  };
}

export function emitModulePackageFile() {
  return {
    name: 'emit-module-package-file',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'package.json',
        source: `{"type":"module"}`
      });
    }
  };
}

export function emitDeclarationFile() {
  return {
    name: 'emit-declaration-file',
    async generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'index.d.ts',
        source: await fs.readFile('./types/index.d.ts')
      });
    }
  };
}
