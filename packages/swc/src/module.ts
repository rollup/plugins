import type { Plugin } from 'rollup';
import { createFilter } from '@rollup/pluginutils';
import type { Options as SWCOptions } from '@swc/core';
import { transform } from '@swc/core';
import { merge } from 'smob';

import type { Options } from './type';

export function swc(input: Options = {}): Plugin {
  const filter = createFilter(input.include, input.exclude);

  const swcOptions: SWCOptions = merge({}, input.swc || {}, {
    jsc: {
      target: 'es2020',
      parser: {
        syntax: 'typescript',
        decorators: true
      },
      transform: {
        decoratorMetadata: true,
        legacyDecorator: true
      },
      loose: true
    }
  });

  return {
    name: 'swc',
    transform(code, id) {
      if (!filter(id)) return null;

      return transform(code, {
        ...swcOptions,
        sourceMaps: true
      });
    }
  };
}
