exports.encodeURIComponent = function () {
  return encodeURIComponent(this.str);
};

// to ensure module is wrapped
global.foo = exports;
