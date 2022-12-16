import { fileURLToPath } from 'url';

import type { NormalizedOutputOptions, RenderedChunk } from 'rollup';
import { hasOwnProperty, isObject, merge } from 'smob';

import type { Options } from './type';
import { WorkerPool } from './worker-pool';

export default function terser(input: Options = {}) {
  const { maxWorkers, ...options } = input;

  const workerPool = new WorkerPool({
    filePath: fileURLToPath(import.meta.url),
    maxWorkers
  });

  return {
    name: 'terser',

    async renderChunk(code: string, chunk: RenderedChunk, outputOptions: NormalizedOutputOptions) {
      const defaultOptions: Options = {
        sourceMap: outputOptions.sourcemap === true || typeof outputOptions.sourcemap === 'string'
      };

      if (outputOptions.format === 'es') {
        defaultOptions.module = true;
      }

      if (outputOptions.format === 'cjs') {
        defaultOptions.toplevel = true;
      }

      try {
        const { code: result, nameCache } = await workerPool.addAsync({
          code,
          options: merge({}, options || {}, defaultOptions)
        });

        if (options.nameCache && nameCache) {
          let vars: Record<string, any> = {
            props: {}
          };

          if (hasOwnProperty(options.nameCache, 'vars') && isObject(options.nameCache.vars)) {
            vars = merge({}, options.nameCache.vars || {}, vars);
          }

          if (hasOwnProperty(nameCache, 'vars') && isObject(nameCache.vars)) {
            vars = merge({}, nameCache.vars, vars);
          }

          // eslint-disable-next-line no-param-reassign
          options.nameCache.vars = vars;

          let props: Record<string, any> = {};

          if (hasOwnProperty(options.nameCache, 'props') && isObject(options.nameCache.props)) {
            // eslint-disable-next-line prefer-destructuring
            props = options.nameCache.props;
          }

          if (hasOwnProperty(nameCache, 'props') && isObject(nameCache.props)) {
            props = merge({}, nameCache.props, props);
          }

          // eslint-disable-next-line no-param-reassign
          options.nameCache.props = props;
        }

        return result;
      } catch (e) {
        return Promise.reject(e);
      }
    }
  };
}
