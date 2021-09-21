module.exports = {
  description: 'preserves meta properties attached to modules by resolvers',
  options: {
    plugins: [
      {
        async resolveId(source, importer, options) {
          if (source.endsWith('dep.js')) {
            return {
              ...(await this.resolve(source, importer, { skipSelf: true, ...options })),
              meta: { test: 'provided' }
            };
          }
          return null;
        },
        moduleParsed({ id, meta: { test } }) {
          if (id.endsWith('dep.js')) {
            if (test !== 'provided') {
              throw new Error(`Meta property missing for ${id}.`);
            }
          } else if (test === 'provided') {
            throw new Error(`Meta property was unexpectedly added to ${id}.`);
          }
        }
      }
    ]
  }
};
