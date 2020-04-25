/* eslint-disable consistent-return */
import path from 'path';

const PREFIX = `\0virtual:`;

export default function virtual(modules) {
  const virtualInputIds = [];
  const resolvedIds = new Map();

  Object.keys(modules).forEach((id) => {
    resolvedIds.set(path.resolve(id), modules[id]);
  });

  return {
    name: 'virtual',

    options(options) {
      let updatedInput = options.input;

      if (typeof updatedInput === 'string' && updatedInput in modules) {
        const virtualId = PREFIX + updatedInput;
        virtualInputIds.push(virtualId);
        updatedInput = virtualId;
      }

      if (typeof updatedInput === 'object') {
        if (Array.isArray(updatedInput)) {
          updatedInput = updatedInput.map((id) => {
            if (id in modules) {
              const virtualId = PREFIX + id;
              virtualInputIds.push(virtualId);
              return virtualId;
            }
            return id;
          });
        } else {
          updatedInput = Object.keys(updatedInput).reduce((nextUpdatedInput, key) => {
            let id = key;
            if (id in modules) {
              const virtualId = PREFIX + id;
              virtualInputIds.push(virtualId);
              id = virtualId;
            }
            // eslint-disable-next-line no-param-reassign
            nextUpdatedInput[id] = updatedInput[key];
            return nextUpdatedInput;
          }, {});
        }
      }

      return {
        ...options,
        input: updatedInput
      };
    },

    resolveId(id, importer) {
      if (virtualInputIds.includes(id)) return id;

      if (id in modules) return PREFIX + id;

      if (importer) {
        // eslint-disable-next-line no-param-reassign
        if (importer.startsWith(PREFIX)) importer = importer.slice(PREFIX.length);
        const resolved = path.resolve(path.dirname(importer), id);
        if (resolvedIds.has(resolved)) return PREFIX + resolved;
      }
    },

    load(id) {
      if (id.startsWith(PREFIX)) {
        // eslint-disable-next-line no-param-reassign
        id = id.slice(PREFIX.length);

        return id in modules ? modules[id] : resolvedIds.get(id);
      }
    }
  };
}
