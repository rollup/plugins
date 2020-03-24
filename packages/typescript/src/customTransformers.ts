import { BuilderProgram, CustomTransformers, Program, TypeChecker } from 'typescript';

import { CustomTransformerFactories, TransformerStage } from '../types';

// List of all transformer stages
const transformerTypes: TransformerStage[] = ['after', 'afterDeclarations', 'before'];

/**
 * Merges all received custom transformer definitions into a single CustomTransformers object
 */
export function mergeTransformers(
  builder: BuilderProgram,
  ...input: Array<CustomTransformerFactories | undefined>
): CustomTransformers {
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
      (transformers[stage] as CustomTransformerFactories['before']).forEach((transformer) => {
        if (!transformer) {
          // Skip empty
          return;
        }

        if ('type' in transformer) {
          if (typeof transformer.factory === 'function') {
            // Allow custom factories to grab the extra information required
            program = program || builder.getProgram();
            typeChecker = typeChecker || program.getTypeChecker();

            let factory: ReturnType<typeof transformer.factory>;

            if (transformer.type === 'program') {
              program = program || builder.getProgram();

              factory = transformer.factory(program);
            } else {
              program = program || builder.getProgram();
              typeChecker = typeChecker || program.getTypeChecker();

              factory = transformer.factory(typeChecker);
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

export default mergeTransformers;
