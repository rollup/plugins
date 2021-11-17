module.exports = {
  description: 'allows treating relative requires as external',
  options: {
    // This import needs to be relative to /test/helpers/util.js
    external: ['../fixtures/function/relative-external/external.js']
  }
};
