import { readFileSync } from 'fs';
import { extname } from 'path';

import { createFilter } from '@rollup/pluginutils';
import svgToMiniDataURI from 'mini-svg-data-uri';

const defaults = {
  dom: false,
  sourceSvg: false,
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

const domTemplate = ({ dataUri }) => `
  var img = new Image();
  img.src = "${dataUri}";
  export default img;
`;

const constTemplate = ({ dataUri }) => `
  var img = "${dataUri}";
  export default img;
`;

const rawTemplate = ({ source }) => `
  var img = '${source}';
  export default img;
`;

const getDataUri = ({ format, isSvg, mime, source }) =>
  isSvg ? svgToMiniDataURI(source) : `data:${mime};${format},${source}`;

function generateTemplate({ format, isSvg, mime, source, options }) {
  if (isSvg && options.sourceSvg) {
    return rawTemplate({ source }).trim();
  }

  const dataUri = getDataUri({ format, isSvg, mime, source });

  return (options.dom ? domTemplate({ dataUri }) : constTemplate({ dataUri })).trim();
}

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

      return generateTemplate({ format, isSvg, mime, source, options });
    }
  };
}
