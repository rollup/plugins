import { CustomTransformers } from 'typescript';

const transformerTypes: Array<keyof CustomTransformers> = ['after', 'afterDeclarations', 'before'];

/**
 * Merges all received custom transformer definitions into a single CustomTransformers object
 */
export function mergeTransformers(
  ...transformers: Array<CustomTransformers | undefined>
): CustomTransformers {
  const accumulator: Required<CustomTransformers> = {
    after: [],
    afterDeclarations: [],
    before: []
  };

  transformers.forEach((t) => {
    if (t) {
      transformerTypes.forEach((k) => {
        const tt = t[k];

        if (tt) {
          accumulator[k].push(...((Array.isArray(tt) ? tt : [tt]) as any[]));
        }
      });
    }
  });

  return accumulator;
}

export default mergeTransformers;
