import { extname } from 'path';

import type { Plugin, NormalizedOutputOptions, OutputBundle, EmittedAsset } from 'rollup';

import type { RollupHtmlOptions, RollupHtmlTemplateOptions } from '../types';

const getFiles = (bundle: OutputBundle): RollupHtmlTemplateOptions['files'] => {
  const result = {} as ReturnType<typeof getFiles>;
  for (const file of Object.values(bundle)) {
    const { fileName } = file;
    const extension = extname(fileName).substring(1);

    result[extension] = (result[extension] || []).concat(file);
  }

  return result;
};

export const makeHtmlAttributes = (attributes: Record<string, any>): string => {
  if (!attributes) {
    return '';
  }

  const keys = Object.keys(attributes);
  // eslint-disable-next-line no-param-reassign
  return keys.reduce((result, key) => (result += ` ${key}="${attributes[key]}"`), '');
};

const defaultTemplate = async ({
  attributes,
  files,
  meta,
  publicPath,
  title,
  addScriptsToHead
}: RollupHtmlTemplateOptions) => {
  // Only directly <script>-load entry chunks; others are loaded indirectly
  let scripts = (files.js || [])
    .filter((file) => file.type === 'chunk' && file.isEntry)
    .map((file) => {
      const attrs = makeHtmlAttributes(attributes.script);
      return `<script src="${publicPath}${file.fileName}"${attrs}></script>`;
    })
    .join('\n');

  let links = (files.css || [])
    .map(({ fileName }) => {
      const attrs = makeHtmlAttributes(attributes.link);
      return `<link href="${publicPath}${fileName}" rel="stylesheet"${attrs}>`;
    })
    .join('\n');

  if (addScriptsToHead === true) {
    links += scripts;
    scripts = '';
  }

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
    ${links}
  </head>
  <body>
    ${scripts}
  </body>
</html>`;
};

const supportedFormats = ['es', 'esm', 'iife', 'umd'];

const defaults: Required<RollupHtmlOptions> = {
  attributes: {
    link: null,
    html: { lang: 'en' },
    script: null
  },
  fileName: 'index.html',
  meta: [{ charset: 'utf-8' }],
  publicPath: '',
  template: defaultTemplate,
  title: 'Rollup Bundle',
  addScriptsToHead: false
};

export default function html(opts: RollupHtmlOptions = {}): Plugin {
  const {
    addScriptsToHead,
    attributes,
    fileName,
    meta,
    publicPath,
    template,
    title
  }: Required<RollupHtmlOptions> = Object.assign({}, defaults, opts);

  return {
    name: 'html',

    async generateBundle(output: NormalizedOutputOptions, bundle: OutputBundle) {
      if (!supportedFormats.includes(output.format) && !opts.template) {
        this.warn(
          `plugin-html: The output format '${
            output.format
          }' is not directly supported. A custom \`template\` is probably required. Supported formats include: ${supportedFormats.join(
            ', '
          )}`
        );
      }

      if (output.format === 'es') {
        attributes.script = Object.assign({}, attributes.script, {
          type: 'module'
        });
      }

      const files = getFiles(bundle);
      const source = await template({
        attributes,
        addScriptsToHead,
        bundle,
        files,
        meta,
        publicPath,
        title
      });

      const htmlFile: EmittedAsset = {
        type: 'asset',
        source,
        name: 'Rollup HTML Asset',
        fileName
      };

      this.emitFile(htmlFile);
    }
  };
}
