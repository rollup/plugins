import type { BuilderProgram, CustomTransformers, Program, TypeChecker } from 'typescript';

import type { CustomTransformerFactories, TransformerStage, TransformerFactory } from '../types';
/**
 * Merges all received custom transformer definitions into a single CustomTransformers object
 */
export function mergeTransformers(
  builder: BuilderProgram,
  ...input: Array<CustomTransformerFactories | undefined>
): CustomTransformers {
  // List of all transformer stages
  const transformerTypes: TransformerStage[] = ['after', 'afterDeclarations', 'before'];

  const accumulator: Required<CustomTransformers> = {
    after: [],
    afterDeclarations: [],
    before: []
  };

  let program: Program;
  let typeChecker: TypeChecker;

  input.forEach((transformers) => {
    if (!transformers) {
      // Skip empty arguments lists
      return;
    }

    transformerTypes.forEach((stage) => {
      getTransformers<typeof stage>(transformers[stage]).forEach((transformer) => {
        if (!transformer) {
          // Skip empty
          return;
        }

        if ('type' in transformer) {
          if (typeof transformer.factory === 'function') {
            let factory: ReturnType<typeof transformer.factory>;

            if (transformer.type === 'program') {
              const currentProgram = program ?? builder.getProgram();
              // Pass a getter so transformers can access the latest Program in watch mode
              factory = transformer.factory(currentProgram, () => builder.getProgram());
              program = currentProgram;
            } else {
              const currentProgram = program ?? builder.getProgram();
              const currentTypeChecker = typeChecker ?? currentProgram.getTypeChecker();
              factory = transformer.factory(currentTypeChecker);
              program = currentProgram;
              typeChecker = currentTypeChecker;
            }

            // Forward the requested reference to the custom transformer factory
            if (factory) {
              accumulator[stage].push(factory as any);
            }
          }
        } else {
          // Add normal transformer factories as is
          accumulator[stage].push(transformer as any);
        }
      });
    });
  });

  return accumulator;
}

function getTransformers<T extends TransformerStage>(
  transformers?: Array<TransformerFactory<T>>
): Array<TransformerFactory<T>> {
  return transformers || [];
}

export default mergeTransformers;
