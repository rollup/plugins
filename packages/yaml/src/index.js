import YAML from 'js-yaml';
import toSource from 'tosource';
import { createFilter, makeLegalIdentifier } from '@rollup/pluginutils';

const defaults = {
  documentMode: 'single',
  transform: null
};
const ext = /\.ya?ml$/;

export default function yaml(opts = {}) {
  const options = Object.assign({}, defaults, opts);
  const { documentMode } = options;
  const filter = createFilter(options.include, options.exclude);
  let loadMethod = null;

  if (documentMode === 'single') {
    loadMethod = YAML.load;
  } else if (documentMode === 'multi') {
    loadMethod = YAML.loadAll;
  } else {
    this.error(
      `plugin-yaml → documentMode: '${documentMode}' is not a valid value. Please choose 'single' or 'multi'`
    );
  }

  return {
    name: 'rollup:yaml',

    transform(content, id) {
      if (!ext.test(id)) return null;
      if (!filter(id)) return null;

      let data = loadMethod(content);

      if (typeof options.transform === 'function') {
        const result = options.transform(data, id);
        // eslint-disable-next-line no-undefined
        if (result !== undefined) {
          data = result;
        }
      }

      const keys = Object.keys(data).filter((key) => key === makeLegalIdentifier(key));
      const code = `var data = ${toSource(data)};\n\n`;
      const exports = ['export default data;']
        .concat(keys.map((key) => `export var ${key} = data.${key};`))
        .join('\n');

      return {
        code: code + exports,
        map: { mappings: '' }
      };
    }
  };
}
