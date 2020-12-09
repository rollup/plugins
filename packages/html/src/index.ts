import { extname } from 'path';

import hasha from 'hasha';

import {
  Plugin,
  NormalizedOutputOptions,
  OutputBundle,
  EmittedAsset,
  OutputChunk,
  OutputAsset
} from 'rollup';

import { RollupHtmlOptions, RollupHtmlTemplateOptions } from '../types';

const getFiles = (bundle: OutputBundle): RollupHtmlTemplateOptions['files'] => {
  const files = Object.values(bundle).filter(
    (file) =>
      file.type === 'chunk' ||
      (typeof file.type === 'string' ? file.type === 'asset' : file.isAsset)
  );
  const result = {} as ReturnType<typeof getFiles>;
  for (const file of files) {
    const { fileName } = file;
    const extension = extname(fileName).substring(1);

    result[extension] = (result[extension] || []).concat(file);
  }

  return result;
};

const makeCspDirective = async (
  files: Record<string, (OutputChunk | OutputAsset)[]>,
  hashAlgorithm: string
): Promise<Record<'http-equiv', string>> => {
  const jsHashes = await Promise.all(
    (files.js || [])
      .filter((chunkOrAsset) => chunkOrAsset.type === 'chunk')
      .map(async (chunk) =>
        hasha.async((chunk as OutputChunk).code, { algorithm: hashAlgorithm, encoding: 'base64' })
      )
  );

  const cssHashes = await Promise.all(
    (files.css || [])
      .filter(
        (chunkOrAsset) => chunkOrAsset.type === 'asset' && typeof chunkOrAsset.source === 'string'
      )
      .map(async (asset) =>
        hasha.async((asset as OutputAsset).source as string, {
          algorithm: hashAlgorithm,
          encoding: 'base64'
        })
      )
  );

  const jsCsp = `script-src ${`${jsHashes.map((hash) => `${hashAlgorithm}-${hash}`).join(' ')}`};`;

  const cssCsp = `style-src ${`${cssHashes.map((hash) => `${hashAlgorithm}-${hash}`).join(' ')}`};`;

  const cspDirectives = {
    'http-equiv': ['content-security-policy:', ...(jsCsp || []), ...(cssCsp || [])].join(' ')
  };
  return cspDirectives;
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
  shouldHash,
  hashAlgorithm
}: RollupHtmlTemplateOptions) => {
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
    .concat(shouldHash ? makeCspDirective(files, hashAlgorithm) : [])
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
const supportedHashAlgorithms = ['sha256', 'sha512'];
const defaults = {
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
  shouldHash: false,
  hashAlgorithm: 'sha256'
};

export default function html(opts: RollupHtmlOptions = {}): Plugin {
  const { attributes, fileName, meta, publicPath, template, title, shouldHash, hashAlgorithm } = {
    ...defaults,
    ...opts
  };

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
      if (shouldHash && !supportedHashAlgorithms.includes(hashAlgorithm)) {
        this.warn(
          `plugin-html: '${hashAlgorithm}' is not recognized as a valid hash algorithm. Supported algorithms include: ${supportedHashAlgorithms.join(
            ', '
          )}`
        );
      }

      if (output.format === 'es') {
        attributes.script = { ...attributes.script, type: 'module' };
      }

      const files = getFiles(bundle);
      const source = await template({
        attributes,
        bundle,
        files,
        meta,
        publicPath,
        title,
        shouldHash,
        hashAlgorithm
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
