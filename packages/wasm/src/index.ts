import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';

import type { Plugin } from 'rollup';
import { createFilter } from '@rollup/pluginutils';

import type { RollupWasmOptions } from '../types';

import { getHelpersModule, HELPERS_ID, LOADER_FUNC_NAME } from './helper';

export function wasm(options: RollupWasmOptions = {}): Plugin {
  // eslint-disable-next-line no-param-reassign
  options.loader ??= options.targetEnv;
  const {
    sync = [],
    maxFileSize = 14 * 1024,
    publicPath = '',
    fileName = '[hash][extname]',
    loader = 'auto'
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

    load(id) {
      if (id === HELPERS_ID) {
        return getHelpersModule(loader);
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
          if (loader === 'auto-inline') {
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

    transform(code, id) {
      if (!filter(id)) {
        return null;
      }

      if (code && /\.wasm$/.test(id)) {
        const isSync = syncFiles.indexOf(id) !== -1;
        const publicFilepath = copies[id] ? `'${copies[id].publicFilepath}'` : null;
        let out = '';
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

        out = `import { ${LOADER_FUNC_NAME} } from ${JSON.stringify(HELPERS_ID)};
export default function (imports) { return ${LOADER_FUNC_NAME}(${+isSync}, ${publicFilepath}, ${src}, imports) }`;

        return {
          map: {
            mappings: ''
          },
          code: out
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
