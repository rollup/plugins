module.exports = {
  description: 'Handles process type guards in replacements',
  options: {
    'process.env.NODE_ENV': '"production"',
    preventAssignment: true,
    objectGuards: true
  }
};
