const foo = require('./esm-function.js');
const Foo = require('./esm-constructor.js');

t.is(foo.bar, 'bar');
t.deepEqual(foo.default('first'), ['first']);
t.deepEqual(foo('second'), ['second']);

t.is(Foo.bar, 'bar');

// eslint-disable-next-line new-cap
const newDefault = new Foo.default('third');
t.deepEqual(newDefault.foo, ['third']);
newDefault.update();
t.is(newDefault.foo, 'updated');

const newFoo = new Foo('fourth');
t.deepEqual(newFoo.foo, ['fourth']);
newFoo.update();
t.is(newFoo.foo, 'updated');
