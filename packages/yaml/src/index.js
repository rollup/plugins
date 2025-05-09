import YAML from 'js-yaml';
import toSource from 'tosource';
import { makeLegalIdentifier } from '@rollup/pluginutils';

const defaults = {
  documentMode: 'single',
  transform: null,
  include: ['*.yaml', '.yml']
};

export default function yaml(opts = {}) {
  const options = Object.assign({}, defaults, opts);
  const { documentMode, include, exclude } = options;
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
    name: 'yaml',
    transform: {
      filter: {
        id: {
          include,
          exclude
        }
      },
      handler(content, id) {
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
    }
  };
}
