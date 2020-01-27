import { readFileSync } from 'fs';
import { extname } from 'path';

import { createFilter } from '@rollup/pluginutils';

const defaults = {
  dom: false,
  exclude: null,
  include: null,
  /** If set to true, generate code to dynamically wrap raw data into Base64 Data URI */
  preferBase64Uri: true
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

      let code = '';

      const format = mime === mimeTypes['.svg'] ? 'utf-8' : 'base64';
      const source = readFileSync(id, format).replace(/[\r\n]+/gm, '');

      // Special case to wrap SVG into Base64 data URI on client side
      // and workaround for errors when passing raw SVG.
      let data = '';
      if (mime === mimeTypes['.svg'] && options.preferBase64Uri) {
        // Create variable with source
        code += `const src = '${source}';`;

        data += `'data:${mime};'`;
        // Generate check if btoa defined;
        // silently assume it's function, to reduce code size
        data += '+ (btoa ? ';
        data += `'base64,' + btoa(src)`;
        data += ' : ';
        data += `'${format},' + src)`;
      } else {
        // All other cases full inline
        data = `'data:${mime};${format},${source}'`;
      }

      code += options.dom
        ? `var img = new Image(); img.src = ${data}; export default img;`
        : `const img = ${data}; export default img;`;

      return code;
    }
  };
}
