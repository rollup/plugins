import { Plugin } from 'rollup';

interface TransformOptions {
  arrow?: boolean;
  classes?: boolean;
  collections?: boolean;
  computedProperty?: boolean;
  conciseMethodProperty?: boolean;
  constLoop?: boolean;
  dangerousForOf?: boolean;
  dangerousTaggedTemplateString?: boolean;
  defaultParameter?: boolean;
  destructuring?: boolean;
  forOf?: boolean;
  generator?: boolean;
  letConst?: boolean;
  modules?: boolean;
  numericLiteral?: boolean;
  parameterDestructuring?: boolean;
  reservedProperties?: boolean;
  spreadRest?: boolean;
  stickyRegExp?: boolean;
  templateString?: boolean;
  unicodeRegExp?: boolean;
}

interface RollupBubleOptions {
  /**
   * A minimatch pattern, or array of patterns, of files that should be
   * processed by this plugin (if omitted, all files are included by default)
   */
  include?: string | RegExp | ReadonlyArray<string | RegExp> | null;
  /**
   * Files that should be excluded, if `include` is otherwise too permissive.
   */
  exclude?: string | RegExp | ReadonlyArray<string | RegExp> | null;
  /**
   * Buble TransformOptions
   */
  transforms?: TransformOptions;
}

/**
 * Convert ES2015 with buble.
 */
export default function buble(options?: RollupBubleOptions): Plugin;
