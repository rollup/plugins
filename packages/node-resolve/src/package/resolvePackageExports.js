import {
  InvalidModuleSpecifierError,
  InvalidConfigurationError,
  isMappings,
  isConditions,
  isMixedExports
} from './utils';
import resolvePackageTarget from './resolvePackageTarget';
import resolvePackageImportsExports from './resolvePackageImportsExports';

async function resolvePackageExports(context, subpath, exports) {
  if (isMixedExports(exports)) {
    throw new InvalidConfigurationError(
      context,
      'All keys must either start with ./, or without one.'
    );
  }

  if (subpath === '.') {
    let mainExport;
    // If exports is a String or Array, or an Object containing no keys starting with ".", then
    if (typeof exports === 'string' || Array.isArray(exports) || isConditions(exports)) {
      mainExport = exports;
    } else if (isMappings(exports)) {
      mainExport = exports['.'];
    }

    if (mainExport) {
      const resolved = await resolvePackageTarget(context, { target: mainExport, subpath: '' });
      if (resolved) {
        return resolved;
      }
    }
  } else if (isMappings(exports)) {
    const resolvedMatch = await resolvePackageImportsExports(context, {
      matchKey: subpath,
      matchObj: exports
    });

    if (resolvedMatch) {
      return resolvedMatch;
    }
  }

  throw new InvalidModuleSpecifierError(context);
}

export default resolvePackageExports;
