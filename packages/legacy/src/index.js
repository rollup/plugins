import { resolve } from 'path';

const validName = /^[a-zA-Z_$][a-zA-Z$_0-9]*$/;

export default function legacy(options) {
  const exports = {};
  Object.keys(options).forEach((file) => {
    exports[resolve(file)] = options[file];
  });

  return {
    name: 'legacy',

    transform(content, id) {
      if (id in exports) {
        let code = content;
        const value = exports[id];

        if (typeof value === 'string') {
          // default export
          code += `\nexport default ${value};`;
        } else {
          const statements = [];
          let i = 1;

          Object.entries(value).forEach(([key, name]) => {
            if (name === key) {
              statements.push(`export { ${key} };`);
            } else if (validName.test(name)) {
              statements.push(`export { ${name} as ${key} };`);
            } else {
              statements.push(`var __export${i} = ${name};\nexport { __export${i} as ${key} };`);
              i += 1;
            }
          });

          code += `\n${statements.join('\n')}`;
        }

        // TODO need a way to say 'sourcemap hasn't changed
        return {
          code,
          map: { mappings: '' }
        };
      }
      return null;
    }
  };
}
