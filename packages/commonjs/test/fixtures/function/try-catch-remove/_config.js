module.exports = {
  pluginOptions: {
    ignoreTryCatch: (id) => (id === 'uninstalled-external-module' ? 'remove' : false)
  }
};
