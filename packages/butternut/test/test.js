const test = require('ava');
const rollup = require('rollup');

const butternut = require('..');

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
      format: 'esm'
    })
    .then(getChunksFromGenerated);
}

test('transforms files', async (t) =>
  rollup
    .rollup({
      input: 'fixtures/basic/main.js',
      plugins: [butternut()]
    })
    .then(getChunksFromBundle)
    .then((generated) => {
     t.is(generated.length, 1);
      t.is(generated[0].code, 'var main=()=>42;export default main\n');
    }));
