const test = require('ava');
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

test('transforms files', async (t) => {
  const bundle = await rollup.rollup({
    input: `${__dirname}/fixtures/basic/main.js`,
    plugins: [buble()]
  });
  const generated = await getChunksFromBundle(bundle);
  t.is(generated.length, 1);
  t.is(generated[0].code, 'function main () { return 42; }\n\nexport { main as default };\n');
});
