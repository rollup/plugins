import sample from './sample.wasm';

const instance1 = sample({ env: {} });

t.is(instance1.exports.main(), 3, 'wasm loaded');

const instance2 = new WebAssembly.Instance(sample(), { env: {} });

t.is(instance2.exports.main(), 3, 'wasm loaded (via module)');
