import sample from './sample.wasm';
import foo from './foo';

const instance = sample({ env: {} });

t.is(instance.exports.main(), 3, 'wasm loaded');

t.is(foo, 'foo');
