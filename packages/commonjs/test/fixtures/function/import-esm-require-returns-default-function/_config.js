module.exports = {
  description: 'allows configuring requireReturnsDefault with a function',
  options: {
    plugins: [
      {
        name: 'test-plugin',
        resolveId(id) {
          if (id.startsWith('dep')) return id;
          return null;
        },
        load(id) {
          const [name, , type] = id.split('_');
          if (name === 'dep') {
            switch (type) {
              case 'default':
                return "export default 'default';";
              case 'mixed':
                return "export default 'default'; export const named = 'named';";
              case 'named':
                return "export const named = 'named';";
              default:
                throw new Error(`Unexpected dependency type "${type}"`);
            }
          }
          return null;
        }
      }
    ]
  },
  pluginOptions: {
    requireReturnsDefault: (id) => {
      const [name, option] = id.split('_');
      if (name === 'dep') {
        switch (option) {
          case 'false':
            return false;
          case 'auto':
            return 'auto';
          case 'preferred':
            return 'preferred';
          case 'true':
            return true;
          default:
            throw new Error(`Unexpected option "${option}"`);
        }
      }
      throw new Error(`Unexpected import of ${id}`);
    }
  }
};
