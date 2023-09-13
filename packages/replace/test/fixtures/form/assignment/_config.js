module.exports = {
  description: "doesn't replace lvalue in assignment",
  options: {
    'process.env.DEBUG': 'replaced',
    preventAssignment: true
  }
};
