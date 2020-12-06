const foo = require('./foo');

t.is(foo, 'foo');

{
  // eslint-disable-next-line no-shadow
  const foo = 'wrong';
  // eslint-disable-next-line global-require
  const bar = require('./foo');
  t.is(foo, 'wrong');
  t.is(bar, 'foo');
}
