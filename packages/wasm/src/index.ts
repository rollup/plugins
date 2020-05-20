import { readFile } from 'fs';
import { resolve } from 'path';

import { Plugin } from 'rollup';

import { RollupWasmOptions } from '../types';

export function wasm(options: RollupWasmOptions = {}): Plugin {
  const syncFiles = (options.sync || []).map((x) => resolve(x));

  return {
    name: 'wasm',

    load(id) {
      if (/\.wasm$/.test(id)) {
        return new Promise((res, reject) => {
          readFile(id, (error, buffer) => {
            if (error != null) {
              reject(error);
            }
            res(buffer.toString('binary'));
          });
        });
      }
      return null;
    },

    banner: `
      function _loadWasmModule (sync, src, imports) {
        var buf = null
        var isNode = typeof process !== 'undefined' && process.versions != null && process.versions.node != null
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

        if (imports && !sync) {
          return WebAssembly.instantiate(buf, imports)
        } else if (!imports && !sync) {
          return WebAssembly.compile(buf)
        } else {
          var mod = new WebAssembly.Module(buf)
          return imports ? new WebAssembly.Instance(mod, imports) : mod
        }
      }
    `.trim(),

    transform(code, id) {
      if (code && /\.wasm$/.test(id)) {
        const src = Buffer.from(code, 'binary').toString('base64');
        const sync = syncFiles.indexOf(id) !== -1;
        return `export default function(imports){return _loadWasmModule(${+sync}, '${src}', imports)}`;
      }
      return null;
    }
  };
}

export default wasm;
