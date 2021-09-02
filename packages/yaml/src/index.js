import YAML from 'js-yaml';
import { createFilter, dataToEsm } from '@rollup/pluginutils';

const defaults = {
  documentMode: 'single',
  safe: true,
  transform: null,
  indent: '\t'
};
const ext = /\.ya?ml$/;

export default function yaml(opts = {}) {
  const options = Object.assign({}, defaults, opts);
  const { documentMode, safe, preferConst, compact, namedExports, indent } = options;
  const filter = createFilter(options.include, options.exclude);
  let loadMethod = null;

  if (documentMode === 'single') {
    loadMethod = safe ? YAML.load : YAML.safeLoad;
  } else if (documentMode === 'multi') {
    loadMethod = safe ? YAML.loadAll : YAML.safeLoadAll;
  } else {
    this.error(
      `plugin-yaml → documentMode: '${documentMode}' is not a valid value. Please choose 'single' or 'multi'`
    );
  }

  return {
    name: 'yaml',

    transform(content, id) {
      if (!ext.test(id) || !filter(id)) return null;

      let data = loadMethod(content);

      if (typeof options.transform === 'function') {
        const result = options.transform(data, id);
        // eslint-disable-next-line no-undefined
        if (result !== undefined) {
          data = result;
        }
      }

      return {
        code: dataToEsm(data, {
          preferConst,
          compact,
          namedExports,
          indent
        }),
        map: { mappings: '' }
      };
    }
  };
}
