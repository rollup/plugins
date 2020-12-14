/* eslint-disable no-await-in-loop */
import resolvePackageTarget from './resolvePackageTarget';

import { InvalidModuleSpecifierError } from './utils';

async function resolvePackageImportsExports(context, { matchKey, matchObj, internal }) {
  if (!matchKey.endsWith('*') && matchKey in matchObj) {
    const target = matchObj[matchKey];
    const resolved = await resolvePackageTarget(context, { target, subpath: '', internal });
    return resolved;
  }

  const expansionKeys = Object.keys(matchObj)
    .filter((k) => k.endsWith('/') || k.endsWith('*'))
    .sort((a, b) => b.length - a.length);

  for (const expansionKey of expansionKeys) {
    const prefix = expansionKey.substring(0, expansionKey.length - 1);

    if (expansionKey.endsWith('*') && matchKey.startsWith(prefix)) {
      const target = matchObj[expansionKey];
      const subpath = matchKey.substring(expansionKey.length - 1);
      const resolved = await resolvePackageTarget(context, {
        target,
        subpath,
        pattern: true,
        internal
      });
      return resolved;
    }

    if (matchKey.startsWith(expansionKey)) {
      const target = matchObj[expansionKey];
      const subpath = matchKey.substring(expansionKey.length);

      const resolved = await resolvePackageTarget(context, { target, subpath, internal });
      return resolved;
    }
  }

  throw new InvalidModuleSpecifierError(context, internal);
}

export default resolvePackageImportsExports;
