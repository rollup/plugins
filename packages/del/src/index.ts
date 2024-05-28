import type { Plugin } from 'rollup';
import internalDel from 'del';

import type { RollupDelOptions } from '../types';

export default function del(options: RollupDelOptions = {}): Plugin {
  const { hook = 'buildStart', runOnce = false, targets = [], verbose = false, ...rest } = options;

  let deleted = false;

  return {
    name: 'delete',
    [hook as string]: async () => {
      if (runOnce && deleted) {
        return;
      }

      const paths = await internalDel(targets, rest);

      if (verbose || rest.dryRun) {
        const message = rest.dryRun
          ? `Expected files and folders to be deleted: ${paths.length}`
          : `Deleted files and folders: ${paths.length}`;

        // eslint-disable-next-line no-console
        console.log(message);

        if (paths.length > 0) {
          paths.forEach((path) => {
            // eslint-disable-next-line no-console
            console.log(path);
          });
        }
      }

      deleted = true;
    }
  };
}
