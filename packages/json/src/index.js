import { createFilter, dataToEsm } from '@rollup/pluginutils';

export default function json(options = {}) {
  const filter = createFilter(options.include, options.exclude);
  const indent = 'indent' in options ? options.indent : '\t';

  return {
    name: 'json',

    // eslint-disable-next-line no-shadow
    transform(json, id) {
      if (id.slice(-5) !== '.json' || !filter(id)) return null;

      return {
        code: dataToEsm(JSON.parse(json), {
          preferConst: options.preferConst,
          compact: options.compact,
          namedExports: options.namedExports,
          indent
        }),
        map: { mappings: '' }
      };
    }
  };
}
