import type { Plugin } from 'rollup';
import { createFilter } from '@rollup/pluginutils';
import type { Options as SWCOptions } from '@swc/core';
import { transform } from '@swc/core';
import { merge } from 'smob';

import type { Options } from './type';

export function swc(input: Options = {}): Plugin {
  const filter = createFilter(input.include, input.exclude);

  const defaults: SWCOptions = {
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
  };

  if (input.swc && input.swc.env) {
    delete defaults.jsc?.target;
  }

  const swcOptions: SWCOptions = merge({}, input.swc || {}, defaults);

  return {
    name: 'swc',
    transform(code, id) {
      if (!filter(id)) return null;

      return transform(code, {
        ...swcOptions,
        sourceMaps: true,
        filename: id
      });
    }
  };
}
