import YAML from 'js-yaml';
import toSource from 'tosource';
import { createFilter, makeLegalIdentifier, suffixRegex } from '@rollup/pluginutils';

const defaults = {
  documentMode: 'single',
  transform: null,
  extensions: ['.yaml', '.yml']
};

function serialize(data, ancestors = []) {
  if (data === null || typeof data !== 'object') return toSource(data);
  if (!Array.isArray(data)) {
    const prototype = Object.getPrototypeOf(data);
    if (prototype !== Object.prototype && prototype !== null) return toSource(data);
  }
  if (ancestors.includes(data)) return '{$circularReference:1}';
  const parents = ancestors.concat([data]);
  if (Array.isArray(data)) {
    return `[${data.map((value) => serialize(value, parents)).join(',')}]`;
  }
  return `{${Object.keys(data)
    .map((key) => `${JSON.stringify(key)}:${serialize(data[key], parents)}`)
    .join(',')}}`;
}

export default function yaml(opts = {}) {
  const options = Object.assign({}, defaults, opts);
  const { documentMode, extensions } = options;
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

  const extensionsFilter = suffixRegex(extensions, 'i');

  return {
    name: 'yaml',

    transform: {
      filter: {
        id: extensionsFilter
      },
      handler(content, id) {
        if (extensions.length === 0 || !extensionsFilter.test(id)) return null;
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
        const code = `var data = ${serialize(data)};\n\n`;
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
