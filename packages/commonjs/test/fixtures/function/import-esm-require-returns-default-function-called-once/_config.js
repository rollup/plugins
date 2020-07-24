const assert = require('assert');

const called = {
  'main.js': 0,
  'both.js': 0,
  'other.js': 0
};

module.exports = {
  description: 'only calls a requireReturnsDefault function once per id',
  options: {
    plugins: [
      {
        name: 'test-plugin',
        resolveId(id) {
          if (id.startsWith('dep')) return id;
          return null;
        },
        load(id) {
          const [prefix, name] = id.split('_');
          if (prefix === 'dep') {
            return `export default '${name}'; export const named = 'unused';`;
          }
          return null;
        },
        buildEnd() {
          assert.deepStrictEqual(called, {
            'main.js': 1,
            'both.js': 1,
            'other.js': 1
          });
        }
      }
    ]
  },
  pluginOptions: {
    requireReturnsDefault: (id) => {
      const [prefix, name] = id.split('_');
      if (prefix === 'dep') {
        called[name] += 1;
        return 'preferred';
      }
      return false;
    }
  }
};
