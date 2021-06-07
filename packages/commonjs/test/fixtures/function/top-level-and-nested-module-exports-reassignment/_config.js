module.exports = {
  description: 'replaces module exports if there is at least one top-level reassignment',
  context: {
    reassignFirstModuleExports: true,
    reassignSecondModuleExports: false
  }
};
