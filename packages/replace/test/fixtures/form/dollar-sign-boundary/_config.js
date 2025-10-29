module.exports = {
  description: 'should not replace when followed by valid identifier characters',
  options: {
    values: {
      'typeof window': '"undefined"'
    },
    preventAssignment: true
  }
};
