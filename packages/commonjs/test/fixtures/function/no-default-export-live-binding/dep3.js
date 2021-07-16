exports.foo = 'foo';
module.exports.update = () => (module.exports = { foo: 'bar' });
