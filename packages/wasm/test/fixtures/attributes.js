import sample from './sample.wasm' with { type: 'webassembly' };

// eslint-disable-next-line no-undef
globalThis.atob = (str) => Buffer.from(str, 'base64').toString('binary');

// eslint-disable-next-line no-undef
result = (async () => {
  const { instance } = await sample({ env: {} });
  t.is(instance.exports.main(), 3, 'wasm loaded');
})();
