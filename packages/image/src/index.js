import { readFileSync } from 'fs';
import { extname } from 'path';

import { createFilter } from 'rollup-pluginutils';

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

      const source = readFileSync(id, 'base64');
      const data = `'data:${mime};base64,${source}'`;
      const code = options.dom
        ? `var img = new Image(); img.src = ${data}; export default img;`
        : `const img = ${data}; export default img;`;

      return code;
    }
  };
}
