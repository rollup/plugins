import fixture from './complex.wasm';

// eslint-disable-next-line no-undef
result = (async () => {
  let { instance } = await fixture({
    env: {
      memory: new WebAssembly.Memory({ initial: 1 }),
      log: console.log // eslint-disable-line no-console
    }
  });
  t.is(instance.exports.parse(), 0, 'wasm loaded');

  const module = await fixture();
  instance = await WebAssembly.instantiate(module, {
    env: {
      memory: new WebAssembly.Memory({ initial: 1 }),
      log: console.log // eslint-disable-line no-console
    }
  });
  t.is(instance.exports.parse(), 0, 'wasm loaded (via module)');
})();
