const { extname } = require('path');

const getFiles = (bundle) => {
  const fileNames = Object.values(bundle).map(({ fileName }) => fileName);
  const files = {};
  for (const fileName of fileNames) {
    const extension = extname(fileName).substring(1);
    files[extension] = (files[extension] || []).concat(fileName);
  }

  return files;
};

const makeHtmlAttributes = (attributes) => {
  if (!attributes) {
    return '';
  }

  const keys = Object.keys(attributes);
  // eslint-disable-next-line no-param-reassign
  return keys.reduce((result, key) => (result += ` ${key}="${attributes[key]}"`), '');
};

const defaultTemplate = async ({ attributes, files, publicPath, title }) => {
  const scripts = (files.js || [])
    .map((fileName) => {
      const attrs = makeHtmlAttributes(attributes.script);
      return `<script src="${publicPath}${fileName}"${attrs}></script>`;
    })
    .join('\n');

  const links = (files.css || [])
    .map((fileName) => {
      const attrs = makeHtmlAttributes(attributes.link);
      return `<link href="${publicPath}${fileName}" rel="stylesheet"${attrs}>`;
    })
    .join('\n');

  return `
<!doctype html>
<html${makeHtmlAttributes(attributes.html)}>
  <head>
    <meta charset="utf-8">
    <title>${title}</title>
    ${links}
  </head>
  <body>
    ${scripts}
  </body>
</html>`;
};

const defaults = {
  attributes: {
    link: null,
    html: { lang: 'en' },
    script: null
  },
  fileName: 'index.html',
  publicPath: '',
  template: defaultTemplate,
  title: 'Rollup Bundle'
};

const html = (opts) => {
  const { attributes, fileName, publicPath, template, title } = Object.assign({}, defaults, opts);
  return {
    name: 'html',

    async generateBundle(output, bundle) {
      const files = getFiles(bundle);
      const source = await template({ attributes, files, publicPath, title });

      const htmlFile = {
        type: 'asset',
        source,
        name: 'Rollup HTML Asset',
        fileName
      };

      this.emitFile(htmlFile);
    }
  };
};

module.exports = html;
module.exports.makeHtmlAttributes = makeHtmlAttributes;
