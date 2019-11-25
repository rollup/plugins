it('warns when importing builtins', () =>
  rollup
    .rollup({
      input: 'samples/builtins/main.js',
      onwarn: expectWarnings([
        {
          code: 'UNRESOLVED_IMPORT',
          source: 'path'
        }
      ]),
      plugins: [
        nodeResolve({
          mainFields: ['browser', 'main'],
          preferBuiltins: true
        })
      ]
    })
    .then(executeBundle)
    .then((module) => {
      assert.equal(module.exports, require('path').sep);
    }));

it('issues a warning when preferring a builtin module without having explicit configuration', () => {
  let warning = null;
  return rollup
    .rollup({
      input: 'samples/prefer-builtin/main.js',
      onwarn({ message }) {
        if (~message.indexOf('preferring')) {
          warning = message;
        }
      },
      plugins: [nodeResolve()]
    })
    .then(() => {
      const localPath = path.join(__dirname, 'node_modules/events/index.js');
      assert.strictEqual(
        warning,
        `preferring built-in module 'events' over local alternative ` +
          `at '${localPath}', pass 'preferBuiltins: false' to disable this behavior ` +
          `or 'preferBuiltins: true' to disable this warning`
      );
    });
});


it('preferBuiltins: true allows preferring a builtin to a local module of the same name', () =>
  rollup
    .rollup({
      input: 'samples/prefer-builtin/main.js',
      onwarn: expectWarnings([
        {
          code: 'UNRESOLVED_IMPORT',
          source: 'events'
        }
      ]),
      plugins: [
        nodeResolve({
          preferBuiltins: true
        })
      ]
    })
    .then(getBundleImports)
    .then((imports) => assert.deepEqual(imports, ['events'])));

it('preferBuiltins: false allows resolving a local module with the same name as a builtin module', () =>
  rollup
    .rollup({
      input: 'samples/prefer-builtin/main.js',
      onwarn: expectWarnings([
        {
          code: 'EMPTY_BUNDLE'
        }
      ]),
      plugins: [
        nodeResolve({
          preferBuiltins: false
        })
      ]
    })
    .then(getBundleImports)
    .then((imports) => assert.deepEqual(imports, [])));
