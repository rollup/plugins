import { createFilter } from '@rollup/pluginutils';
import loader from 'graphql-tag/loader';

import { toESModules } from './toESModules';

export default function graphql({ include, exclude } = {}) {
  // path filter
  const filter = createFilter(include, exclude);
  // only .graphql and .gql files
  const filterExt = /\.(graphql|gql)$/i;
  const filterCode = /(gql`)([^`]+)(`)/gm;

  return {
    name: 'graphql',
    transform(source, id) {
      if (!filter(id)) return null;
      const containsGqlLiteral = filterCode.test(source);
      if (!filterExt.test(id) && !containsGqlLiteral) return null;

      let code;

      if (containsGqlLiteral) {
        if (typeof source !== 'string') return null;
        code = source
          .replace(filterCode, (_, _2, match) => loader.call({ cacheable() {} }, match).slice(15))
          .replace(/.*(from |require\()'graphql-tag'\)?.*/g, '');
      } else {
        // XXX: this.cachable() in graphql-tag/loader
        code = toESModules(
          loader.call(
            {
              cacheable() {}
            },
            source
          )
        );
      }

      const map = { mappings: '' };

      return {
        code,
        map
      };
    }
  };
}
