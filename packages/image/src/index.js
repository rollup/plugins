import { readFileSync } from 'fs';
import { extname } from 'path';

import { createFilter } from '@rollup/pluginutils';

const defaults = {
  dom: false,
  exclude: null,
  include: null
};

const mimeTypes = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp'
};

const domTemplate = ({ format, mime, source }) => `
  const img = new Image();
  const source = ${format === 'base64' ? `'${source}'` : `btoa('${source}')`};
  img.src = 'data:${mime};base64,' + source;
  export default img;
`;

const constTemplate = ({ format, mime, source }) => `
  const escape = (data) => new URLSearchParams(data).toString();
  const source = '${source}';
  const img = 'data:${mime};${format},' + ${format === 'base64' ? 'source' : 'escape(source)'};
  export default img;
`;

export default function image(opts = {}) {
  const options = Object.assign({}, defaults, opts);
  const filter = createFilter(options.include, options.exclude);

  return {
    name: 'image',

    load(id) {
      if (!filter(id)) {
        return null;
      }

      const mime = mimeTypes[extname(id)];
      if (!mime) {
        // not an image
        return null;
      }

      const isSvg = mime === mimeTypes['.svg'];
      const format = isSvg ? 'utf-8' : 'base64';
      const source = readFileSync(id, format).replace(/[\r\n]+/gm, '');
      const code = options.dom
        ? domTemplate({ format, mime, source })
        : constTemplate({ format, mime, source });

      return code.trim();
    }
  };
}
