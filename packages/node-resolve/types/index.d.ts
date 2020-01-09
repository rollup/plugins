import { Plugin } from 'rollup';
import { AsyncOpts } from 'resolve';

export interface Options {
  /**
   * the fields to scan in a package.json to determine the entry point
   * if this list contains "browser", overrides specified in "pkg.browser"
   * will be used
   * @default ['module', 'main']
   */
  mainFields?: ReadonlyArray<string>;

  /**
   * some package.json files have a "browser" field which specifies
   * alternative files to load for people bundling for the browser. If
   * that's you, either use this option or add "browser" to the
   * "mainfields" option, otherwise pkg.browser will be ignored
   * @default false
   */
  browser?: boolean;

  /**
   * not all files you want to resolve are .js files
   * @default [ '.mjs', '.js', '.json', '.node' ]
   */
  extensions?: ReadonlyArray<string>;

  /**
   * whether to prefer built-in modules (e.g. `fs`, `path`) or
   * local ones with the same names
   * @default true
   */
  preferBuiltins?: boolean;

  /**
   * Lock the module search in this path (like a chroot). Module defined
   * outside this path will be marked as external
   * @default '/'
   */
  jail?: string;

  /**
   * @deprecated use "resolveOnly" instead
   * @default null
   */
  only?: ReadonlyArray<string | RegExp> | null;

  /**
   * If true, inspect resolved files to check that they are
   * ES2015 modules
   * @default false
   */
  modulesOnly?: boolean;

  /**
   * Force resolving for these modules to root's node_modules that helps
   * to prevent bundling the same package multiple times if package is
   * imported from dependencies.
   */
  dedupe?: string[] | ((importee: string) => boolean);

  /**
   * Any additional options that should be passed through
   * to node-resolve
   */
  customResolveOptions?: AsyncOpts;

  /**
   * @deprecated use "resolveOnly" instead
   * @default null
   */
  resolveOnly?: ReadonlyArray<string | RegExp> | null;

  /**
   * Root directory to resolve modules from. Used when resolving entrypoint imports,
   * and when resolving deduplicated modules. Useful when executing rollup in a package
   * of a monorepository.
   * @default process.cwd()
   */
  rootDir?: string;
}

/**
 * Locate modules using the Node resolution algorithm, for using third party modules in node_modules
 */
export default function nodeResolve(options?: Options): Plugin;
