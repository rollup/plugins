import config from './config.yml';

expect(config.length).toBe(3);

const [first, second, third] = config;

expect(first.version).toBe('v1');
expect(first.spec.selector).toBe(1);
expect(second.version).toBe('v2');
expect(second.spec.selector).toBe(2);
expect(third.version).toBe('v3');
expect(third.spec.selector).toBe(3);
