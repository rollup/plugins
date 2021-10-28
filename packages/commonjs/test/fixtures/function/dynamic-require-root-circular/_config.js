const { nodeResolve } = require('@rollup/plugin-node-resolve');

module.exports = {
  description: "resolves circular references through indirect access (../ to module's root)",
  options: {
    plugins: [nodeResolve()]
  },
  pluginOptions: {
    dynamicRequireTargets: [
      'fixtures/function/dynamic-require-root-circular/node_modules/custom-module{,/**/*.js}'
    ]
  }
};
