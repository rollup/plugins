import { transform } from 'buble';
import { createFilter } from 'rollup-pluginutils';

export default function buble(options = {}) {
  const filter = createFilter(options.include, options.exclude);
  const transformOptions = { ...options, transforms: { ...options.transforms, modules: false } };

  return {
    name: 'buble',

    transform(code, id) {
      if (!filter(id)) return null;

      try {
        return transform(code, transformOptions);
      } catch (e) {
        e.plugin = 'buble';
        if (!e.loc) e.loc = {};
        e.loc.file = id;
        e.frame = e.snippet;
        throw e;
      }
    }
  };
}
