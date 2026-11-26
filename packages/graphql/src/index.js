import { createFilter } from '@rollup/pluginutils';
import loader from 'graphql-tag/loader.js';

import { toESModules } from './toESModules';

export default function graphql({ include, exclude } = {}) {
  // path filter
  const filter = createFilter(include, exclude);
  // only .graphql, .graphqls (schema), and .gql files
  const filterExt = /\.(graphqls?|gql)$/i;
  // Rollup 5 appends encoded import attributes to the id as a query
  const filterExtWithQuery = /\.(graphqls?|gql)(?:$|\?)/i;

  return {
    name: 'graphql',
    transform: {
      filter: {
        id: filterExtWithQuery
      },
      handler(source, id, transformOptions) {
        const rawId = (transformOptions && transformOptions.rawId) || id;
        if (!filter(rawId)) return null;
        if (!filterExt.test(rawId)) return null;

        // XXX: this.cachable() in graphql-tag/loader
        const code = toESModules(
          loader.call(
            {
              cacheable() {}
            },
            source
          )
        );

        const map = { mappings: '' };

        return {
          code,
          map
        };
      }
    }
  };
}
