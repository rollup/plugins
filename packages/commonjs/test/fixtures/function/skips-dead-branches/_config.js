module.exports = {
  global: (global, t) => {
    t.is(global.a, undefined);
    t.is(global.b, 2);
    t.is(global.c, undefined);
  }
};
