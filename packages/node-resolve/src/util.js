import { promisify } from 'util';

import resolve from 'resolve';

const resolveId = promisify(resolve);

// returns the imported package name for bare module imports
export function getPackageName(id) {
  if (id.startsWith('.') || id.startsWith('/')) {
    return null;
  }

  const split = id.split('/');

  // @my-scope/my-package/foo.js -> @my-scope/my-package
  // @my-scope/my-package -> @my-scope/my-package
  if (split[0][0] === '@') {
    return `${split[0]}/${split[1]}`;
  }

  // my-package/foo.js -> my-package
  // my-package -> my-package
  return split[0];
}

export function getMainFields(options) {
  let mainFields;
  if (options.mainFields) {
    ({ mainFields } = options);
  } else {
    mainFields = ['main', 'module'];
  }
  if (options.browser && mainFields.indexOf('browser') === -1) {
    return ['browser'].concat(mainFields);
  }
  if (!mainFields.length) {
    throw new Error('Please ensure at least one `mainFields` value is specified');
  }
  return mainFields;
}

export function normalizeInput(input) {
  if (Array.isArray(input)) {
    return input;
  } else if (typeof input === 'object') {
    return Object.values(input);
  }

  // otherwise it's a string
  return input;
}

// Resolve module specifiers in order. Promise resolves to the first
// module that resolves successfully, or the error that resulted from
// the last attempted module resolution.
export function resolveImportSpecifiers(importSpecifierList, resolveOptions) {
  let p = Promise.resolve();
  for (let i = 0; i < importSpecifierList.length; i++) {
    p = p.then((v) => {
      // if we've already resolved to something, just return it.
      if (v) return v;

      return resolveId(importSpecifierList[i], resolveOptions);
    });

    if (i < importSpecifierList.length - 1) {
      // swallow MODULE_NOT_FOUND errors from all but the last resolution
      p = p.catch((err) => {
        if (err.code !== 'MODULE_NOT_FOUND') {
          throw err;
        }
      });
    }
  }

  return p;
}
