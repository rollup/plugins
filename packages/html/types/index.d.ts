import type { Plugin, OutputChunk, OutputAsset, OutputBundle } from 'rollup';

export interface RollupHtmlTemplateOptions {
  addScriptsToHead?: boolean;
  attributes: Record<string, any>;
  bundle: OutputBundle;
  files: Record<string, (OutputChunk | OutputAsset)[]>;
  meta: Record<string, any>[];
  publicPath: string;
  title: string;
}

export interface RollupHtmlOptions {
  addScriptsToHead?: boolean;
  attributes?: Record<string, any>;
  fileName?: string;
  meta?: Record<string, any>[];
  publicPath?: string;
  template?: (templateoptions: RollupHtmlTemplateOptions) => string | Promise<string>;
  title?: string;
}

export function makeHtmlAttributes(attributes: Record<string, string>): string;

/**
 * A Rollup plugin which creates HTML files to serve Rollup bundles.
 * @param options - Plugin options.
 * @returns Plugin instance.
 */
export default function html(options?: RollupHtmlOptions): Plugin;
