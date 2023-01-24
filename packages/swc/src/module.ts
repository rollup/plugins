import type { Plugin } from 'rollup';
import { transform } from '@swc/core';
import { merge } from 'smob';

import type { Options } from './type';

export function swc(input: Options = {}): Plugin {
  const options: Options = merge(
    {
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
    },
    input
  );

  return {
    name: 'swc',
    transform(code) {
      return transform(code, {
        ...options,
        sourceMaps: true
      });
    }
  };
}
