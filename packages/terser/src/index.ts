import { NormalizedOutputOptions, RenderedChunk } from 'rollup';
import { minify, MinifyOptions } from 'terser';

export default function terser(options?: MinifyOptions) {
  return {
    name: 'terser',

    async renderChunk(code: string, chunk: RenderedChunk, outputOptions: NormalizedOutputOptions) {
      const defaultOptions: MinifyOptions = {
        sourceMap: outputOptions.sourcemap === true || typeof outputOptions.sourcemap === 'string'
      };

      if (outputOptions.format === 'es') {
        defaultOptions.module = true;
      }

      if (outputOptions.format === 'cjs') {
        defaultOptions.toplevel = true;
      }

      return minify(code, { ...defaultOptions, ...(options || {}) });
    }
  };
}
