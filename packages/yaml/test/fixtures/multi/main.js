import config from './config.yml';

t.is(config.length, 3);

const [first, second, third] = config;

t.is(first.version, 'v1');
t.is(first.spec.selector, 1);
t.is(second.version, 'v2');
t.is(second.spec.selector, 2);
t.is(third.version, 'v3');
t.is(third.spec.selector, 3);
