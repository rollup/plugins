import { FilterPattern } from '@rollup/pluginutils';
import { Plugin } from 'rollup';

export interface RollupGraphqlOptions {
  /**
   * All JSON files will be parsed by default,
   * but you can also specifically include files
   */
  include?: FilterPattern;
  /**
   * All JSON files will be parsed by default,
   * but you can also specifically exclude files
   */
  exclude?: FilterPattern;
}

/**
 * Convert .gql/.graphql files to ES6 modules
 */
export default function graphql(options?: RollupGraphqlOptions): Plugin;
