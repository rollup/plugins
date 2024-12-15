module.exports = {
  description: 'respects module-side-effects when requiring wrapped dependencies',
  options: {
    plugins: [
      {
        name: 'test',
        async resolveId(source, importer, options) {
          if (source.endsWith('./foo.js')) {
            const resolved = await this.resolve(source, importer, options);
            return { ...resolved, moduleSideEffects: false };
          }
          return null;
        }
      }
    ]
  },
  pluginOptions: {
    strictRequires: true
  },
  global: (global, t) => {
    t.is(global.foo, undefined);
    t.is(global.bar, 'bar');
  }
};
