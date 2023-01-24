import type { Plugin } from 'rollup';

import { transformCJSToESMSyntax } from './utils';

export function commonjsShim(): Plugin {
  return {
    name: 'commonjs-shim',
    renderChunk(code, chunk, opts) {
      if (opts.format === 'es') {
        return transformCJSToESMSyntax(code);
      }

      return null;
    }
  };
}
