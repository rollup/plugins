module.exports = {
  description: 'uses correct entry files names when preserving modules',
  options: {
    preserveModules: true
  },
  pluginOptions: {
    // Our entry is wrapped, so it will not be functional without a proper proxy
    strictRequires: true
  },
  // This will only work if "main" corresponds to the actual entry point that unwraps main.js
  global: (global, t) => {
    t.is(global.main, 'main');
  }
};
