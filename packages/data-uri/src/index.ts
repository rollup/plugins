import { URL } from 'url';

import type { Plugin, RollupError } from 'rollup';

import { dataToEsm } from '@rollup/pluginutils';

const reDataUri = /^([^/]+\/[^;,]+)(;base64)?,([\s\S]*)$/;
const mimeTypes = {
  js: 'text/javascript',
  json: 'application/json'
};

export function dataUri(): Plugin {
  const resolved: { [key: string]: { mime: string | null; content: string | null } } = {};

  return {
    name: 'dataUri',

    resolveId(id) {
      if (resolved[id]) {
        return id;
      }

      if (!reDataUri.test(id)) {
        return null;
      }

      const uri = new URL(id);

      if (uri.protocol !== 'data:') {
        return null;
      }

      const empty = [null, null, null, null, null];
      const [, mime, format, data] = reDataUri.exec(uri.pathname) || empty;

      if (Object.values(mimeTypes).includes(mime as string) && data) {
        const base64 = format && /base64/i.test(format.substring(1));
        const content = base64 ? Buffer.from(data, 'base64').toString('utf-8') : data;

        resolved[id] = { mime, content };

        return id;
      }

      return null;
    },

    load(id) {
      if (!resolved[id]) {
        return null;
      }

      const { mime, content } = resolved[id];

      if (!content) {
        return null;
      }

      if (mime === 'text/javascript') {
        return content;
      } else if (mime === 'application/json') {
        let json = '';
        try {
          json = JSON.parse(content);
        } catch (e: any) {
          const error: RollupError = {
            message: e.toString(),
            cause: e,
            plugin: '@rollup/plugin-data-uri',
            pluginCode: 'DU$JSON'
          };
          this.error(error);
        }

        return dataToEsm(json, {
          preferConst: true,
          compact: false,
          namedExports: true,
          indent: '  '
        });
      }
      return null;
    }
  };
}
export default dataUri;
