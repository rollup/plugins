describe('symlinks', () => {
  function createMissingDirectories() {
    createDirectory('./samples/symlinked/first/node_modules');
    createDirectory('./samples/symlinked/second/node_modules');
    createDirectory('./samples/symlinked/third/node_modules');
  }

  function createDirectory(pathToDir) {
    if (!fs.existsSync(pathToDir)) {
      fs.mkdirSync(pathToDir);
    }
  }

  function linkDirectories() {
    fs.symlinkSync('../../second', './samples/symlinked/first/node_modules/second', 'dir');
    fs.symlinkSync('../../third', './samples/symlinked/first/node_modules/third', 'dir');
    fs.symlinkSync('../../third', './samples/symlinked/second/node_modules/third', 'dir');
  }

  function unlinkDirectories() {
    fs.unlinkSync('./samples/symlinked/first/node_modules/second');
    fs.unlinkSync('./samples/symlinked/first/node_modules/third');
    fs.unlinkSync('./samples/symlinked/second/node_modules/third');
  }

  beforeEach(() => {
    createMissingDirectories();
    linkDirectories();
  });

  afterEach(() => {
    unlinkDirectories();
  });

  it('resolves symlinked packages', () =>
    rollup
      .rollup({
        input: 'samples/symlinked/first/index.js',
        onwarn: expectNoWarnings,
        plugins: [nodeResolve()]
      })
      .then(executeBundle)
      .then((module) => {
        assert.equal(module.exports.number1, module.exports.number2);
      }));

  it('preserves symlinks if `preserveSymlinks` is true', () =>
    rollup
      .rollup({
        input: 'samples/symlinked/first/index.js',
        onwarn: expectNoWarnings,
        plugins: [nodeResolve()],
        preserveSymlinks: true
      })
      .then(executeBundle)
      .then((module) => {
        assert.notEqual(module.exports.number1, module.exports.number2);
      }));
});
