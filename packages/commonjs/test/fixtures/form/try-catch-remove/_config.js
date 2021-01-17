module.exports = {
  options: {
    ignoreTryCatch: (id) => id === 'uninstalled-external-module' ? 'remove' : false
  }
};
