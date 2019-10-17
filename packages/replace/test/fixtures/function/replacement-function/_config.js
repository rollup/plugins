module.exports = {
  description: 'allows replacement to be a function',
  pluginOptions: {
    __filename(id) {
      return JSON.stringify(id.slice(__dirname.length + 1));
    }
  }
};
