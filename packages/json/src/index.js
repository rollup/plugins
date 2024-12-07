import { createFilter, dataToEsm } from '@rollup/pluginutils';

export default function json(options = {}) {
  const {
    include,
    exclude,
    indent = '\t',
    preferConst,
    compact,
    namedExports,
    includeArbitraryNames
  } = options;
  const filter = createFilter(include, exclude);

  return {
    name: 'json',

    // eslint-disable-next-line no-shadow
    transform(code, id) {
      if (id.slice(-5) !== '.json' || !filter(id)) return null;

      try {
        const parsed = JSON.parse(code);
        return {
          code: dataToEsm(parsed, {
            preferConst,
            compact,
            namedExports,
            includeArbitraryNames,
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
