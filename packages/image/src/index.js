import { readFileSync } from 'fs';
import { extname } from 'path';

import { createFilter } from 'rollup-pluginutils';

const mimeTypes = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp'
};

export default function image(options = {}) {
  const filter = createFilter(options.include, options.exclude);

  return {
    name: 'image',

    load(id) {
      if (!filter(id)) return null;

      const mime = mimeTypes[extname(id)];
      // not an image
      if (!mime) return null;

      const data = readFileSync(id, 'base64');
      const code = `var img = new Image(); img.src = 'data:${mime};base64,${data}'; export default img;`;

      const ast = {
        type: 'Program',
        sourceType: 'module',
        start: 0,
        end: null,
        body: []
      };

      return { ast, code, map: { mappings: '' } };
    }
  };
}
