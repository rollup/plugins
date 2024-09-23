module.exports = {
  description: "doesn't replace lvalue in typescript declare",
  isTypescript: true,
  options: {
    'NAME': 'replaced',
    preventAssignment: true
  }
};
