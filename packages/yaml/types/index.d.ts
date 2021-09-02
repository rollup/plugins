import { FilterPattern } from '@rollup/pluginutils';
import { Plugin } from 'rollup';

type ValidYamlType =
  | number
  | string
  | boolean
  | null
  | { [key: string]: ValidYamlType }
  | ValidYamlType[];

interface RollupYamlOptions {
  /**
   * A minimatch pattern, or array of patterns, which specifies the files in the build the plugin
   * should operate on.
   * By default all files are targeted.
   */
  include?: FilterPattern;
  /**
   * A minimatch pattern, or array of patterns, which specifies the files in the build the plugin
   * should _ignore_.
   * By default no files are ignored.
   */
  exclude?: FilterPattern;
  /**
   * - If `true`, specifies that the data in the target YAML file(s) contain trusted data and
   * should be loaded normally.
   * - If `false`, data is assumed to be untrusted and will be loaded using
   * [safety methods](https://github.com/nodeca/js-yaml#safeload-string---options-).
   * @default true
   */
  safe?: boolean;
  /**
   * A function which can optionally mutate parsed YAML.
   * The function should return the mutated `object`, or `undefined` which will make no changes to
   * the parsed YAML.
   * @default undefined
   */
  transform?: (data: ValidYamlType, filePath: string) => ValidYamlType | undefined;
  /**
   * - If `single`, specifies that the target YAML documents contain only one document in the
   * target file(s).
   * - If more than one [document stream](https://yaml.org/spec/1.2/spec.html#id2801681) exists in
   * the target YAML file(s), set `documentMode: 'multi'`.
   * @default 'single'
   */
  documentMode?: 'single' | 'multi';
  /**
   * For tree-shaking, properties will be declared as variables, using
   * either `var` or `const`.
   * @default false
   */
  preferConst?: boolean;
  /**
   * Specify indentation for the generated default export
   * @default '\t'
   */
  indent?: string;
  /**
   * Ignores indent and generates the smallest code
   * @default false
   */
  compact?: boolean;
  /**
   * Generate a named export for every property of the JSON object
   * @default true
   */
  namedExports?: boolean;
  /**
   * If `.json` files should be parsed with this plugin as well, since YAML is a superset of JSON
   * @default false
   */
  includeJSON?: boolean;
}

/**
 * A Rollup plugin which Converts YAML files to ES6 modules.
 */
export default function yaml(options?: RollupYamlOptions): Plugin;
