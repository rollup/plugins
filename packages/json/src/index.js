import { createFilter, dataToEsm } from '@rollup/pluginutils';
import { extname } from 'path';

export default function json(options = {}) {
  const filter = createFilter(options.include, options.exclude);
  const indent = 'indent' in options ? options.indent : '\t';
  const extensions = new Set('extensions' in options ? options.extensions : ['.json']);

  return {
    name: 'json',

    // eslint-disable-next-line no-shadow
    transform(code, id) {
      const extension = extname(id);

      if (!extensions.has(extension) || !filter(id)) return null;

      try {
        const parsed = JSON.parse(code);
        return {
          code: dataToEsm(parsed, {
            preferConst: options.preferConst,
            compact: options.compact,
            namedExports: options.namedExports,
            includeArbitraryNames: options.includeArbitraryNames,
            indent
          }),
          map: { mappings: '' }
        };
      } catch (err) {
        const message = 'Could not parse JSON file';
        this.error({ message, id, cause: err });
        return null;
      }
    }
  };
}
