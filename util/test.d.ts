/* eslint-disable import/no-extraneous-dependencies */
import type { RollupBuild, OutputOptions, OutputChunk, OutputAsset } from 'rollup';
import type { Assertions } from 'ava';

interface GetCode {
  (bundle: RollupBuild, outputOptions?: OutputOptions | null, allFiles?: false): Promise<string>;
  (bundle: RollupBuild, outputOptions: OutputOptions | null | undefined, allFiles: true): Promise<
    Array<{
      code: OutputChunk['code'] | undefined;
      fileName: OutputChunk['fileName'] | OutputAsset['fileName'];
      source: OutputAsset['source'] | undefined;
    }>
  >;
}

export const getCode: GetCode;

export function evaluateBundle(bundle: RollupBuild): Promise<Pick<NodeModule, 'exports'>>;

export function getImports(bundle: RollupBuild): Promise<string[]>;

export function getResolvedModules(bundle: RollupBuild): Promise<Record<string, string>>;

export function onwarn(warning: string | any): void;

export function testBundle(
  t: Assertions,
  bundle: RollupBuild,
  options: { inject: Record<string, any>; options: Record<string, any> }
): Promise<{
  code: string;
  error?: any;
  result?: any;
  module: Pick<NodeModule, 'exports'>;
}>;
