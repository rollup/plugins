module.exports = {
  multi: {
    output1: 'input1.js',
    output2: 'input2.js'
  },
  importers: {
    output2: ['input1.js']
  }
};
