import { URL } from 'url';

import { Plugin, RollupError } from 'rollup';

import { dataToEsm } from '@rollup/pluginutils';

const reDataUri = /^([^/]+\/[^;,]+)(;base64)?,([\s\S]*)$/;
const mimeTypes = {
  js: 'text/javascript',
  json: 'application/json'
};

export default function dataUri(): Plugin {
  const resolved: { [key: string]: { mime?: string, content?: string } } = {};

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

      const [, mime, , content] = reDataUri.exec(uri.pathname) || [null, null, null, null];

      if (Object.values(mimeTypes).includes(mime as string)) {
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
        } catch (e) {
          const error: RollupError = {
            message: e.toString(),
            parserError: e,
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
