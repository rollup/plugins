import type { BaseNode } from 'estree';

export interface AttachedScope {
  parent?: AttachedScope;
  isBlockScope: boolean;
  declarations: { [key: string]: boolean };
  addDeclaration(node: BaseNode, isBlockDeclaration: boolean, isVar: boolean): void;
  contains(name: string): boolean;
}

export interface DataToEsmOptions {
  compact?: boolean;
  /**
   * @desc When this option is set, dataToEsm will generate a named export for keys that
   * are not a valid identifier, by leveraging the "Arbitrary Module Namespace Identifier
   * Names" feature. See: https://github.com/tc39/ecma262/pull/2154
   */
  includeArbitraryNames?: boolean;
  indent?: string;
  namedExports?: boolean;
  objectShorthand?: boolean;
  preferConst?: boolean;
}

/**
 * A valid `picomatch` glob pattern, or array of patterns.
 */
export type FilterPattern = ReadonlyArray<string | RegExp> | string | RegExp | null;

/**
 * Adds an extension to a module ID if one does not exist.
 */
export function addExtension(filename: string, ext?: string): string;

/**
 * Attaches `Scope` objects to the relevant nodes of an AST.
 * Each `Scope` object has a `scope.contains(name)` method that returns `true`
 * if a given name is defined in the current scope or a parent scope.
 */
export function attachScopes(ast: BaseNode, propertyName?: string): AttachedScope;

/**
 * Constructs a filter function which can be used to determine whether or not
 * certain modules should be operated upon.
 * @param include If `include` is omitted or has zero length, filter will return `true` by default.
 * @param exclude ID must not match any of the `exclude` patterns.
 * @param options Optionally resolves the patterns against a directory other than `process.cwd()`.
 * If a `string` is specified, then the value will be used as the base directory.
 * Relative paths will be resolved against `process.cwd()` first.
 * If `false`, then the patterns will not be resolved against any directory.
 * This can be useful if you want to create a filter for virtual module names.
 */
export function createFilter(
  include?: FilterPattern,
  exclude?: FilterPattern,
  options?: { resolve?: string | false | null }
): (id: string | unknown) => boolean;

export type StringFilter<Value = string | RegExp> =
  | (Value | Value[])
  | {
      include?: Value | Value[];
      exclude?: Value | Value[];
    };

/**
 * Constructs a StringFilter object which can be passed to Rollup for module filtering.
 * Provides the same filtering behavior as `createFilter()` but returns a declarative
 * filter object instead of a function.
 *
 * @param include If omitted or empty, all modules are included by default.
 * @param exclude ID must not match any of the `exclude` patterns.
 * @param options Optionally resolves patterns against a directory other than `process.cwd()`.
 * If a `string` is specified, it will be used as the base directory.
 * Relative paths are resolved against `process.cwd()` first.
 * If `false`, patterns will not be resolved (useful for virtual module names).
 * @returns A StringFilter object compatible with Rollup's filter configuration.
 */
export function createHookFilter(
  include?: FilterPattern,
  exclude?: FilterPattern,
  options?: { resolve?: string | false | null }
): StringFilter;

/**
 * Transforms objects into tree-shakable ES Module imports.
 * @param data An object to transform into an ES module.
 */
export function dataToEsm(data: unknown, options?: DataToEsmOptions): string;

/**
 * Constructs a RegExp that matches the exact string specified.
 * @param str the string to match.
 * @param flags flags for the RegExp.
 */
export function exactRegex(str: string | string[], flags?: string): RegExp;

/**
 * Extracts the names of all assignment targets based upon specified patterns.
 * @param param An `acorn` AST Node.
 */
export function extractAssignedNames(param: BaseNode): string[];

/**
 * Constructs a bundle-safe identifier from a `string`.
 */
export function makeLegalIdentifier(str: string): string;

/**
 * Converts path separators to forward slash.
 */
export function normalizePath(filename: string): string;

/**
 * Constructs a RegExp that matches a value that has the specified prefix.
 * @param str the string to match.
 * @param flags flags for the RegExp.
 */
export function prefixRegex(str: string | string[], flags?: string): RegExp;

/**
 * Constructs a RegExp that matches a value that has the specified suffix.
 * @param str the string to match.
 * @param flags flags for the RegExp.
 */
export function suffixRegex(str: string | string[], flags?: string): RegExp;

export type AddExtension = typeof addExtension;
export type AttachScopes = typeof attachScopes;
export type CreateFilter = typeof createFilter;
export type CreateHookFilter = typeof createHookFilter;
export type ExactRegex = typeof exactRegex;
export type ExtractAssignedNames = typeof extractAssignedNames;
export type MakeLegalIdentifier = typeof makeLegalIdentifier;
export type NormalizePath = typeof normalizePath;
export type DataToEsm = typeof dataToEsm;
export type PrefixRegex = typeof prefixRegex;
export type SuffixRegex = typeof suffixRegex;

declare const defaultExport: {
  addExtension: AddExtension;
  attachScopes: AttachScopes;
  createFilter: CreateFilter;
  createHookFilter: CreateHookFilter;
  dataToEsm: DataToEsm;
  exactRegex: ExactRegex;
  extractAssignedNames: ExtractAssignedNames;
  makeLegalIdentifier: MakeLegalIdentifier;
  normalizePath: NormalizePath;
  prefixRegex: PrefixRegex;
  suffixRegex: SuffixRegex;
};
export default defaultExport;
