import { Plugin, OutputChunk, OutputAsset } from 'rollup';

export interface RollupPluginHtmlOptions {
  title?: string;
  attributes?: Record<string, any>;
  fileName?: string;
  meta?: Record<string, any>[];
  publicPath?: string;
  template?: (templateOptions: RollupPluginHtmlTemplateOptions) => string;
}

export interface RollupPluginHtmlTemplateOptions {
  title: string;
  attributes: string;
  publicPath: string;
  bundle: Record<string, OutputChunk | OutputAsset>;
  files: {
    js: (OutputChunk | OutputAsset)[];
    css: (OutputChunk | OutputAsset)[];
    map: (OutputChunk | OutputAsset)[];
  };
}

export function makeHtmlAttributes(attributes: Record<string, string>): string;

/**
 * A Rollup plugin which creates HTML files to serve Rollup bundles.
 * @param options - Plugin options.
 * @returns Plugin instance.
 */
export default function html(options: RollupPluginHtmlOptions): Plugin;
