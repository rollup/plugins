import { readFileSync } from 'fs';
import { extname } from 'path';

import { createFilter } from '@rollup/pluginutils';

const defaults = {
  dom: false,
  exclude: null,
  include: null,
  inline: false
};

const mimeTypes = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp'
};

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

      const isSVG = mime === mimeTypes['.svg'];
      const format = isSVG ? 'utf-8' : 'base64';
      const source = readFileSync(id, format).replace(/[\r\n]+/gm, '');
      let code;
      if (isSVG && options.inline) {
        const svg = JSON.stringify(source);
        code = options.dom
          ? `const svg = (new DOMParser().parseFromString(${svg}, 'image/svg+xml')).firstChild; export default svg;`
          : `const svg = ${svg}; export default svg;`;
      } else {
        const data = `'data:${mime};${format},${source}'`;
        code = options.dom
          ? `const img = new Image(); img.src = ${data}; export default img;`
          : `const img = ${data}; export default img;`;
      }

      return code;
    }
  };
}
