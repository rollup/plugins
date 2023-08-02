import {
  InvalidModuleSpecifierError,
  InvalidConfigurationError,
  isMappings,
  isConditions,
  isMixedExports
} from './utils';
import resolvePackageTarget from './resolvePackageTarget';
import resolvePackageImportsExports from './resolvePackageImportsExports';

/**
 * Implementation of PACKAGE_EXPORTS_RESOLVE
 */
async function resolvePackageExports(context: any, subpath: string, exports: any) {
  // If exports is an Object with both a key starting with "." and a key not starting with "."
  if (isMixedExports(exports)) {
    // throw an Invalid Package Configuration error.
    throw new InvalidConfigurationError(
      context,
      'All keys must either start with ./, or without one.'
    );
  }

  // If subpath is equal to ".", then
  if (subpath === '.') {
    // Let mainExport be undefined.
    let mainExport: string | string[] | Record<string, any> | undefined;
    // If exports is a String or Array, or an Object containing no keys starting with ".", then
    if (typeof exports === 'string' || Array.isArray(exports) || isConditions(exports)) {
      // Set mainExport to exports
      mainExport = exports;
      // Otherwise if exports is an Object containing a "." property, then
    } else if (isMappings(exports)) {
      // Set mainExport to exports["."]
      mainExport = exports['.'];
    }

    // If mainExport is not undefined, then
    if (mainExport) {
      // Let resolved be the result of PACKAGE_TARGET_RESOLVE with target = mainExport
      const resolved = await resolvePackageTarget(context, {
        target: mainExport,
        patternMatch: '',
        isImports: false
      });
      // If resolved is not null or undefined, return resolved.
      if (resolved) {
        return resolved;
      }
    }

    // Otherwise, if exports is an Object and all keys of exports start with ".", then
  } else if (isMappings(exports)) {
    // Let resolved be the result of PACKAGE_IMPORTS_EXPORTS_RESOLVE
    const resolvedMatch = await resolvePackageImportsExports(context, {
      matchKey: subpath,
      matchObj: exports,
      isImports: false
    });

    // If resolved is not null or undefined, return resolved.
    if (resolvedMatch) {
      return resolvedMatch;
    }
  }

  // Throw a Package Path Not Exported error.
  throw new InvalidModuleSpecifierError(context);
}

export default resolvePackageExports;
