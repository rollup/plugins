import { minify } from 'terser';

function terser(terserOptions = {}) {
  return {
    name: 'terser',

    async renderChunk(code, _chunk, outputOptions) {
      const defaultOptions = {
        sourceMap: !!outputOptions.sourcemap
      };

      // eslint-disable-next-line default-case
      switch (outputOptions.format) {
        case 'es':
        case 'esm':
          defaultOptions.module = true;
          break;
        case 'cjs':
          defaultOptions.toplevel = true;
          break;
      }

      const effectiveTerserOptions = { ...defaultOptions, ...terserOptions };
      const result = await minify(code, effectiveTerserOptions);
      return result;
    }
  };
}

export default terser;
