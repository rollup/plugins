import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';

import { Plugin } from 'rollup';

import { RollupWasmOptions } from '../types';

export function wasm(options: RollupWasmOptions = {}): Plugin {
  const { sync = [], maxFileSize = 14 * 1024, publicPath = '' } = options;

  const syncFiles = sync.map((x) => path.resolve(x));
  const copies = Object.create(null);

  return {
    name: 'wasm',

    load(id) {
      if (!/\.wasm$/.test(id)) {
        return null;
      }

      return Promise.all([fs.promises.stat(id), fs.promises.readFile(id)]).then(
        ([stats, buffer]) => {
          if ((maxFileSize && stats.size > maxFileSize) || maxFileSize === 0) {
            const hash = createHash('sha1')
              .update(buffer)
              .digest('hex')
              .substr(0, 16);

            const filename = `${hash}.wasm`;
            const publicFilepath = `${publicPath}${filename}`;

            // only copy if the file is not marked `sync`, `sync` files are always inlined
            if (syncFiles.indexOf(id) === -1) {
              copies[id] = {
                filename,
                publicFilepath,
                buffer
              };
            }
          }

          return buffer.toString('binary');
        }
      );
    },

    banner: `
      function _loadWasmModule (sync, filepath, src, imports) {
        function _instantiateOrCompile(source, imports, stream) {
          var instantiateFunc = stream ? WebAssembly.instantiateStreaming : WebAssembly.instantiate;
          var compileFunc = stream ? WebAssembly.compileStreaming : WebAssembly.compile;
          
          if (imports) {
            return instantiateFunc(source, imports)
          } else {
            return compileFunc(source)
          }
        }

        var buf = null
        var isNode = typeof process !== 'undefined' && process.versions != null && process.versions.node != null
        
        if (filepath && isNode) {
          var fs = eval('require("fs")')
          var path = eval('require("path")')

          return new Promise((resolve, reject) => {
            fs.readFile(path.resolve(__dirname, filepath), (error, buffer) => {
              if (error != null) {
                reject(error)
              }

              resolve(_instantiateOrCompile(buffer, imports, false))
            });
          });
        } else if (filepath) {
          return _instantiateOrCompile(fetch(filepath), imports, true)
        }
        
        if (isNode) {
          buf = Buffer.from(src, 'base64')
        } else {
          var raw = globalThis.atob(src)
          var rawLength = raw.length
          buf = new Uint8Array(new ArrayBuffer(rawLength))
          for(var i = 0; i < rawLength; i++) {
             buf[i] = raw.charCodeAt(i)
          }
        }

        if(sync) {
          var mod = new WebAssembly.Module(buf)
          return imports ? new WebAssembly.Instance(mod, imports) : mod
        } else {
          return _instantiateOrCompile(buf, imports, false)
        }
      }
    `.trim(),

    transform(code, id) {
      if (code && /\.wasm$/.test(id)) {
        const isSync = syncFiles.indexOf(id) !== -1;
        const publicFilepath = copies[id] ? `'${copies[id].publicFilepath}'` : null;
        let src;

        if (publicFilepath === null) {
          src = Buffer.from(code, 'binary').toString('base64');
          src = `'${src}'`;
        } else {
          if (isSync) {
            this.error('non-inlined files can not be `sync`.');
          }
          src = null;
        }

        return `export default function(imports){return _loadWasmModule(${+isSync}, ${publicFilepath}, ${src}, imports)}`;
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
