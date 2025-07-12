import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';

import type { Plugin } from 'rollup';
import { createFilter } from '@rollup/pluginutils';

import type { RollupWasmOptions } from '../types';

import { getHelpersModule, HELPERS_ID, SELF_ID } from './helper';

export function wasm(options: RollupWasmOptions = {}): Plugin {
  const {
    sync = [],
    maxFileSize = 14 * 1024,
    publicPath = '',
    targetEnv = 'auto',
    fileName = '[hash][extname]'
  } = options;

  const syncFiles = sync.map((x) => path.resolve(x));
  const copies = Object.create(null);
  const filter = createFilter(options.include, options.exclude);

  return {
    name: 'wasm',

    resolveId(id, importer) {
      if (id === HELPERS_ID) {
        return id;
      }

      if (id === SELF_ID) {
        return importer;
      }

      return null;
    },

    load(id) {
      if (id === HELPERS_ID) {
        return getHelpersModule(targetEnv);
      }

      if (!filter(id)) {
        return null;
      }

      if (!/\.wasm$/.test(id)) {
        return null;
      }
      this.addWatchFile(id);

      return Promise.all([fs.promises.stat(id), fs.promises.readFile(id)]).then(
        ([stats, buffer]) => {
          if (targetEnv === 'auto-inline') {
            return buffer.toString('binary');
          }

          if ((maxFileSize && stats.size > maxFileSize) || maxFileSize === 0) {
            const hash = createHash('sha1').update(buffer).digest('hex').substr(0, 16);
            const ext = path.extname(id);
            const name = path.basename(id, ext);

            const outputFileName = fileName
              .replace(/\[hash\]/g, hash)
              .replace(/\[extname\]/g, ext)
              .replace(/\[name\]/g, name);

            const publicFilepath = `${publicPath}${outputFileName}`;

            // only copy if the file is not marked `sync`, `sync` files are always inlined
            if (syncFiles.indexOf(id) === -1) {
              copies[id] = {
                filename: outputFileName,
                publicFilepath,
                buffer
              };
            }
          }

          return buffer.toString('binary');
        }
      );
    },

    async transform(code, id) {
      if (!filter(id)) {
        return null;
      }

      if (code && /\.wasm$/.test(id)) {
        const isSync = syncFiles.indexOf(id) !== -1;
        const publicFilepath = copies[id] ? `'${copies[id].publicFilepath}'` : null;
        let src;

        const buffer = Buffer.from(code, 'binary');

        if (publicFilepath === null) {
          src = buffer.toString('base64');
          src = `'${src}'`;
        } else {
          if (isSync) {
            this.error('non-inlined files can not be `sync`.');
          }
          src = null;
        }

        // @ts-ignore
        const mod = await WebAssembly.compile(buffer, {
          // Compile with string builtins to remove string builtins from import list below.
          // Alternatively an explicit filtering of imports from the known string builtins
          // (possibly with polyfilling) could be done.
          builtins: ['js-string']
        });
        const imports = WebAssembly.Module.imports(mod);
        const exports = WebAssembly.Module.exports(mod);

        // Generate import statements for WASM module imports
        let importStatements = '';
        let importObj = '';
        let i = 0;
        for (const { module, kind, name } of imports) {
          if (module.startsWith('wasm-js:'))
            throw new WebAssembly.LinkError(
              `Invalid Wasm use of reserved module import "${module}"`
            );
          if (name.startsWith('wasm:') || name.startsWith('wasm-js:'))
            throw new WebAssembly.LinkError(
              `Invalid Wasm use of reserved module import name "${name}"`
            );
          importStatements += `import * as i${i} from ${JSON.stringify(module)};\n`;
          // We use the special _nsMap map from ns to instance to allow direct global
          // bindings between Wasm modules.
          importObj += `${JSON.stringify(module)}: ${
            kind === 'global' ? `_nsMap.get(i${i})?.exports || i${i}` : `i${i}`
          },`;
          i += 1;
        }

        // Always provide an imports object, even if empty
        importObj = importObj ? `{${importObj}}` : '{}';

        // Generate export statements for WASM module exports
        let exportStatements = '';
        let exportList = '';
        i = 0;
        for (const { name, kind } of exports) {
          if (name.startsWith('wasm-js:') || name.startsWith('wasm:')) {
            throw new WebAssembly.LinkError(`Invalid use of reserved export name "${name}"`);
          }
          const idOrName = /^[$_a-z][$_a-z0-9]+$/i.test(name) ? name : JSON.stringify(name);
          exportStatements += `let e${i} = __wasmInstance.exports[${JSON.stringify(name)}];\n`;
          // Unwrap global exports.
          if (kind === 'global') {
            exportStatements += `try { e${i} = e${i}.value } catch { e${i} = undefined }\n`;
          }
          if (exportList) exportList += ', ';
          exportList += `e${i} as ${idOrName}`;
          i += 1;
        }

        return {
          map: {
            mappings: ''
          },
          code: `import { _loadWasmModule, _nsMap } from ${JSON.stringify(HELPERS_ID)};
${importStatements}
const __wasmInstance = ${
            isSync ? '' : 'await '
          }_loadWasmModule(${!!isSync}, ${publicFilepath}, ${src}, ${importObj});
${exportStatements}

import * as m from ${JSON.stringify(SELF_ID)};
_nsMap.set(m, __wasmInstance);

export { ${exportList} };
`
        };
      }
      return null;
    },

    generateBundle: async function write() {
      await Promise.all(
        Object.keys(copies).map(async (name) => {
          const copy = copies[name];

          this.emitFile({
            type: 'asset',
            source: copy.buffer,
            name: 'Rollup WASM Asset',
            fileName: copy.filename
          });
        })
      );
    }
  };
}

export default wasm;
