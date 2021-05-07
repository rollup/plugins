// eslint-disable-next-line no-global-assign
({ foo: module } = { foo: 'foo' });
t.is(module, 'foo');
