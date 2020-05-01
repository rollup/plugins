/* eslint-disable import/no-extraneous-dependencies */
import { RollupBuild, OutputOptions, OutputChunk, OutputAsset } from 'rollup';
import { Assertions } from 'ava';

interface GetCode {
  (bundle: RollupBuild, outputOptions: OutputOptions, allFiles?: false): Promise<string>;
  (bundle: RollupBuild, outputOptions: OutputOptions, allFiles: true): Promise<
    Array<{
      code: OutputChunk['code'] | undefined;
      fileName: OutputChunk['fileName'] | OutputAsset['fileName'];
      source: OutputAsset['source'] | undefined;
    }>
  >;
}

export const getCode: GetCode;

export function getImports(bundle: RollupBuild): Promise<string[]>;

export function getResolvedModules(bundle: RollupBuild): Promise<Record<string, string>>;

export function testBundle(
  t: Assertions,
  bundle: RollupBuild,
  args?: object
): Promise<{
  code: string;
  error?: any;
  result?: any;
  module: Pick<NodeModule, 'exports'>;
}>;
