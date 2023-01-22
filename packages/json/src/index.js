import { createFilter, dataToEsm } from '@rollup/pluginutils';

export default function json(options = {}) {
  const filter = createFilter(options.include, options.exclude);
  const indent = 'indent' in options ? options.indent : '\t';

  return {
    name: 'rollup:json',

    // eslint-disable-next-line no-shadow
    transform(code, id) {
      if (id.slice(-5) !== '.json' || !filter(id)) return null;

      try {
        const parsed = JSON.parse(code);
        return {
          code: dataToEsm(parsed, {
            preferConst: options.preferConst,
            compact: options.compact,
            namedExports: options.namedExports,
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
