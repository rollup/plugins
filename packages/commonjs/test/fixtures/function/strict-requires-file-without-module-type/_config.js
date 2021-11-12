module.exports = {
  description:
    'identifies files without module features as commonjs if they are required by another file',
  pluginOptions: {
    strictRequires: true
  }
};
