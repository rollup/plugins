import YAML from 'js-yaml';
import toSource from 'tosource';
import { createFilter, makeLegalIdentifier } from 'rollup-pluginutils';

const ext = /\.ya?ml$/;

export default function yamll(options = {}) {
  const filter = createFilter(options.include, options.exclude);

  return {
    name: 'yaml',

    transform(content, id) {
      if (!ext.test(id)) return null;
      if (!filter(id)) return null;

      let data = YAML.load(content);

      if (typeof options.transform === 'function') {
        const result = options.transform(data);
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
