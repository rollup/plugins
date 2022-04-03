if (Math.random() < 2) require('./foo.js');
if (Math.random() > 2) require('./bar.js');

global.main = true;

t.is(global.foo, true, 'foo');
t.is(global.main, true, 'main');
