const rollup = require('rollup');

const buble = require('..');

process.chdir(__dirname);

const getChunksFromGenerated = (generated) => {
  if (generated.output) {
    return generated.output.length
      ? generated.output
      : Object.keys(generated.output).map((chunkName) => generated.output[chunkName]);
  }
  return [generated];
};

function getChunksFromBundle(bundle) {
  return bundle
    .generate({
      format: 'es'
    })
    .then(getChunksFromGenerated);
}

test('transforms files', async () => {
  const bundle = await rollup.rollup({
    input: `${__dirname}/fixtures/basic/main.js`,
    plugins: [buble()]
  });
  const generated = await getChunksFromBundle(bundle);
  expect(generated.length).toBe(1);
  expect(generated[0].code).toBe(
    'function main () { return 42; }\n\nexport { main as default };\n'
  );
});
