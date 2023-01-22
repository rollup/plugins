import { transform } from 'buble';
import type { Plugin } from 'rollup';
import { createFilter } from '@rollup/pluginutils';

import type { RollupBubleOptions } from '../types';

export default function buble(options: RollupBubleOptions = {}): Plugin {
  const filter = createFilter(options.include, options.exclude);
  const transformOptions = { ...options, transforms: { ...options.transforms, modules: false } };

  return {
    name: 'rollup:buble',

    transform(code, id) {
      if (!filter(id)) return null;

      try {
        return transform(code, transformOptions);
      } catch (e: any) {
        e.plugin = 'rollup:buble';
        if (!e.loc) e.loc = {};
        e.loc.file = id;
        e.frame = e.snippet;
        throw e;
      }
    }
  };
}
