const { extname } = require('path');

const getFiles = (bundle) => {
  const files = Object.values(bundle).filter(
    (file) => file.isEntry || (typeof file.type === 'string' ? file.type === 'asset' : file.isAsset)
  );
  const result = {};
  for (const file of files) {
    const { fileName } = file;
    const extension = extname(fileName).substring(1);
    result[extension] = (result[extension] || []).concat(file);
  }

  return result;
};

const makeHtmlAttributes = (attributes) => {
  if (!attributes) {
    return '';
  }

  return Object.entries(attributes)
    .map(([key, value]) => ` ${key}="${value}"`)
    .join('');
};

const defaultTemplate = async ({ attributes, body, files, head, meta, publicPath, title }) => {
  const scripts = (files.js || [])
    .map(({ fileName }) => {
      const attrs = makeHtmlAttributes(attributes.script);
      return `<script src="${publicPath}${fileName}"${attrs}></script>`;
    })
    .join('\n');

  const links = (files.css || [])
    .map(({ fileName }) => {
      const attrs = makeHtmlAttributes(attributes.link);
      return `<link href="${publicPath}${fileName}" rel="stylesheet"${attrs}>`;
    })
    .join('\n');

  const metas = meta
    .map((input) => {
      const attrs = makeHtmlAttributes(input);
      return `<meta${attrs}>`;
    })
    .join('\n');

  return `
<!doctype html>
<html${makeHtmlAttributes(attributes.html)}>
  <head>
    ${metas}
    <title>${title}</title>
    ${links}${head}
  </head>
  <body>
    ${scripts}${body}
  </body>
</html>`;
};

const supportedFormats = ['es', 'esm', 'iife', 'umd'];

const defaults = {
  attributes: {
    link: null,
    html: { lang: 'en' },
    script: null
  },
  body: '',
  fileName: 'index.html',
  head: '',
  meta: [{ charset: 'utf-8' }],
  publicPath: '',
  template: defaultTemplate,
  title: 'Rollup Bundle'
};

const html = (opts = {}) => {
  const { attributes, body, fileName, head, meta, publicPath, template, title } = Object.assign(
    {},
    defaults,
    opts
  );

  return {
    name: 'html',

    async generateBundle(output, bundle) {
      if (!supportedFormats.includes(output.format) && !opts.template) {
        this.warn(
          `plugin-html: The output format '${
            output.format
          }' is not directly supported. A custom \`template\` is probably required. Supported formats include: ${supportedFormats.join(
            ', '
          )}`
        );
      }

      if (output.format === 'esm' || output.format === 'es') {
        attributes.script = Object.assign({}, attributes.script, { type: 'module' });
      }

      const files = getFiles(bundle);
      const source = await template({
        attributes,
        body,
        bundle,
        files,
        head,
        meta,
        publicPath,
        title
      });

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
