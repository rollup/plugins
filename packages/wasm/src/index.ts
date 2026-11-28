import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';

import type { Plugin } from 'rollup';
import { createFilter } from '@rollup/pluginutils';

import type { RollupWasmOptions } from '../types';

import { getHelpersModule, HELPERS_ID } from './helper';

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

    resolveId(id) {
      if (id === HELPERS_ID) {
        return id;
      }

      return null;
    },

    load(id, loadOptions) {
      if (id === HELPERS_ID) {
        return getHelpersModule(targetEnv);
      }

      const rawId = loadOptions?.rawId ?? id;

      if (!filter(rawId)) {
        return null;
      }

      if (!/\.wasm$/.test(rawId)) {
        return null;
      }
      this.addWatchFile(rawId);

      return Promise.all([fs.promises.stat(rawId), fs.promises.readFile(rawId)]).then(
        ([stats, buffer]) => {
          if (targetEnv === 'auto-inline') {
            return buffer.toString('binary');
          }

          if ((maxFileSize && stats.size > maxFileSize) || maxFileSize === 0) {
            const hash = createHash('sha1').update(buffer).digest('hex').substr(0, 16);
            const ext = path.extname(rawId);
            const name = path.basename(rawId, ext);

            const outputFileName = fileName
              .replace(/\[hash\]/g, hash)
              .replace(/\[extname\]/g, ext)
              .replace(/\[name\]/g, name);

            const publicFilepath = `${publicPath}${outputFileName}`;

            // only copy if the file is not marked `sync`, `sync` files are always inlined
            if (syncFiles.indexOf(rawId) === -1) {
              copies[rawId] = {
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

    transform(code, id, transformOptions) {
      const rawId = transformOptions?.rawId ?? id;

      if (!filter(rawId)) {
        return null;
      }

      if (code && /\.wasm$/.test(rawId)) {
        const isSync = syncFiles.indexOf(rawId) !== -1;
        const publicFilepath = copies[rawId] ? `'${copies[rawId].publicFilepath}'` : null;
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

        return {
          map: {
            mappings: ''
          },
          code: `import { _loadWasmModule } from ${JSON.stringify(HELPERS_ID)};
export default function(imports){return _loadWasmModule(${+isSync}, ${publicFilepath}, ${src}, imports)}`
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
