import { addNamed } from '@babel/helper-module-imports';

import { HELPERS } from './constants.js';

export default function importHelperPlugin({ types: t }) {
  return {
    pre(file) {
      const cachedHelpers = {};
      file.set('helperGenerator', (name) => {
        if (!file.availableHelper(name)) {
          return null;
        }

        if (cachedHelpers[name]) {
          return t.cloneNode(cachedHelpers[name]);
        }

        return (cachedHelpers[name] = addNamed(file.path, name, HELPERS));
      });
    }
  };
}
