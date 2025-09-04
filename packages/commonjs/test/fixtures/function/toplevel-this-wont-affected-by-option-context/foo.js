exports.augmentThis = function augmentThis() {
  this.x = 'x';
};

this.y = 'y';

const window = {};
// Top level `this` in commonjs module is not affected by the context option
t.is(this === window, false);

t.is(this, module.exports);
t.is(module.exports.y, 'y');
t.is(this.augmentThis, module.exports.augmentThis);
