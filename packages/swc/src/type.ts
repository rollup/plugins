import type { FilterPattern } from '@rollup/pluginutils';
import type { Options as SWCOptions } from '@swc/core';

export interface Options {
  swc?: SWCOptions;

  include?: FilterPattern;

  exclude?: FilterPattern;
}
