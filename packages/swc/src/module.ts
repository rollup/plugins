import type { Plugin } from 'rollup';
import type { Options as SWCOptions } from '@swc/core';
import { transform } from '@swc/core';
import { merge } from 'smob';

import type { Options } from './type';

export function swc(input: Options = {}): Plugin {
  const swcOptions: SWCOptions = merge(
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
    input.swc || {}
  );

  return {
    name: 'swc',
    transform(code) {
      return transform(code, {
        ...swcOptions,
        sourceMaps: true
      });
    }
  };
}
