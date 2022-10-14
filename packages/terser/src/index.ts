import { minify, MinifyOptions } from 'terser';

export default function terser(options?: MinifyOptions) {
  return {
    name: "terser",

    async renderChunk(code, chunk, outputOptions) {
      const defaultOptions : MinifyOptions = {
        sourceMap: outputOptions.sourcemap === true ||
          typeof outputOptions.sourcemap === "string",
      };

      if (outputOptions.format === "es" || outputOptions.format === "esm") {
        defaultOptions.module = true;
      }

      if (outputOptions.format === "cjs") {
        defaultOptions.toplevel = true;
      }

      return await minify(code, {...defaultOptions, ...(options || {})});
    },
  };
}
