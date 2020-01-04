import { Plugin } from 'rollup';

import { dataToEsm } from '@rollup/pluginutils';

const reDataUri = /^([^/]+\/[^;,]+)(;base64)?,([\s\S]*)$/;

const dataUri = (): Plugin => {
  return {
    name: 'dataUri',

    load(id) {
      if (!reDataUri.test(id)) {
        return null;
      }

      const uri = new URL(id);

      if (uri.protocol !== 'data:') {
        return null;
      }

      const [, mime, , content] = reDataUri.exec(uri.pathname) || [null, null, null, null];

      if (!content) {
        return null;
      }

      if (mime === 'text/javascript') {
        return content;
      } else if (mime === 'application/json') {
        let json = '';
        try {
          json = JSON.parse(content);
        } catch (error) {
          this.warn(error);
          return null;
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
};

export default dataUri;
