const rollup = require('rollup');
const graphql = require('..');

process.chdir(__dirname);

describe('plugin', () => {
  it('should parse a simple graphql file', async function() {
    const bundle = await rollup.rollup({
      input: 'samples/basic/index.js',
      plugins: [graphql()]
    });
    const { output: [{ code }] } = await bundle.generate({
      format: 'cjs'
    });
    const exports = {};
    const fn = new Function('exports', code);

    fn(exports);

    expect(exports.doc).toBeDefined();
    expect(exports.doc.kind).toBe('Document');
  });

  it('should include a fragment', async function() {
    const bundle = await rollup.rollup({
      input: 'samples/fragments/index.js',
      plugins: [graphql()]
    });
    const { output: [{ code }] } = await bundle.generate({
      format: 'cjs'
    });
    const exports = {};
    const fn = new Function('exports', code);

    fn(exports);

    expect(exports.doc).toBeDefined();
    expect(exports.doc.kind).toBe('Document');
    expect(exports.doc.definitions[1].name.value).toBe('HeroFragment');
  });

  it('should support multi-imports', async function () {
    const bundle = await rollup.rollup({
      input: 'samples/multi-imports/index.js',
      plugins: [graphql()]
    });
    const { output: [{ code }] } = await bundle.generate({
      format: 'cjs'
    });
    const exports = {};
    const fn = new Function('exports', code);

    fn(exports);

    expect(exports.GetHero).toBeDefined();
    expect(exports.GetHero.kind).toBe('Document');
    expect(exports.GetHero.definitions[0].name.value).toBe('GetHero');

    expect(exports.GetHeros).toBeDefined();
    expect(exports.GetHeros.kind).toBe('Document');
    expect(exports.GetHeros.definitions[0].name.value).toBe('GetHeros');
  });
});
