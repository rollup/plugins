import { addNamed } from '@babel/helper-module-imports';

import { HELPERS } from './constants';

export default function importHelperPlugin() {
  return {
    pre(file) {
      const cachedHelpers = {};
      // eslint-disable-next-line consistent-return
      file.set('helperGenerator', (name) => {
        if (!file.availableHelper(name)) {
          return null;
        }

        if (cachedHelpers[name]) {
          return cachedHelpers[name];
        }

        return (cachedHelpers[name] = addNamed(file.path, name, HELPERS));
      });
    }
  };
}
