import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { createHash } from 'crypto';

import { Plugin } from 'rollup';

import { RollupWasmOptions } from '../types';

const makeDir = require('make-dir');

const fsStatPromise = promisify(fs.stat);
const fsReadFilePromise = promisify(fs.readFile);

export function wasm(options: RollupWasmOptions = {}): Plugin {
  const { limit = 14 * 1024, sync = [] } = options;

  const syncFiles = sync.map((x) => path.resolve(x));
  const copies = Object.create(null);

  return {
    name: 'wasm',

    load(id) {
      if (!/\.wasm$/.test(id)) {
        return null;
      }

      return Promise.all([fsStatPromise(id), fsReadFilePromise(id)]).then(([stats, buffer]) => {
        if ((limit && stats.size > limit) || limit === 0) {
          const hash = createHash('sha1')
            .update(buffer)
            .digest('hex')
            .substr(0, 16);

          copies[id] = `${hash}.wasm`;
        }

        return buffer.toString('binary');
      });
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
          fs = require('fs')
          path = require('path')

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
        let filepath;
        let src;

        if (isSync) {
          filepath = null;
        } else {
          filepath = copies[id] ? `'${copies[id]}'` : null;
        }

        if (filepath === null) {
          src = Buffer.from(code, 'binary').toString('base64');
          src = `'${src}'`;
        } else {
          src = null;
        }

        return `export default function(imports){return _loadWasmModule(${+isSync}, ${filepath}, ${src}, imports)}`;
      }
      return null;
    },
    generateBundle: async function write(outputOptions) {
      const base = outputOptions.dir || path.dirname(outputOptions.file);

      await makeDir(base);

      await Promise.all(
        Object.keys(copies).map(async (name) => {
          const output = copies[name];
          // Create a nested directory if the fileName pattern contains
          // a directory structure
          const outputDirectory = path.join(base, path.dirname(output));
          await makeDir(outputDirectory);
          return copy(name, path.join(base, output));
        })
      );
    }
  };
}

function copy(src, dest) {
  return new Promise((resolve, reject) => {
    const read = fs.createReadStream(src);
    read.on('error', reject);
    const write = fs.createWriteStream(dest);
    write.on('error', reject);
    write.on('finish', resolve);
    read.pipe(write);
  });
}

export default wasm;
