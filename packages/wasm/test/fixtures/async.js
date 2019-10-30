import fixture from './sample.wasm';

// eslint-disable-next-line no-undef
result = (async () => {
  const module = await fixture();
  let { instance } = await fixture({ env: {} });
  t.is(instance.exports.main(), 3, 'wasm loaded');

  instance = await WebAssembly.instantiate(module, { env: {} });
  t.is(instance.exports.main(), 3, 'wasm loaded (via module)');
})();
