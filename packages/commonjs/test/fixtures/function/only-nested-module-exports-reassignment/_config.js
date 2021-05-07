module.exports = {
  description:
    'provides an object as exports when there are only nested module.exports reassignments',
  context: {
    reassignFirstModuleExports: true,
    reassignSecondModuleExports: false
  }
};
