import { OutputOptions, Plugin } from 'rollup';
import { transform } from '@swc/core';
import { merge } from 'smob';
import { Options } from './type';

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
    renderChunk(code, chunk, outputOptions) {
      const chunkOptions = merge({}, options);

      if (outputOptions.sourcemap === 'inline') {
        chunkOptions.sourceMaps = 'inline';
      }
      if (typeof outputOptions.sourcemap === 'boolean') {
        chunkOptions.sourceMaps = outputOptions.sourcemap;
      }

      return transform(code, chunkOptions);
    }
  };
}
