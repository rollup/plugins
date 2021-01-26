const exported = {};
module.exports = exported;
module.exports.foo = 'foo';

t.deepEqual(exported, { foo: 'foo' });
