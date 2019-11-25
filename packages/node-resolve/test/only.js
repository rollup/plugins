it('"only" option allows to specify the only packages to resolve', () =>
  rollup
    .rollup({
      input: 'samples/only/main.js',
      onwarn: expectWarnings([
        {
          code: 'UNRESOLVED_IMPORT',
          source: '@scoped/foo'
        },
        {
          code: 'UNRESOLVED_IMPORT',
          source: '@scoped/bar'
        }
      ]),
      plugins: [
        nodeResolve({
          only: ['test']
        })
      ]
    })
    .then(getBundleImports)
    .then((imports) => assert.deepEqual(imports, ['@scoped/foo', '@scoped/bar'])));

it('"only" option works with a regex', () =>
  rollup
    .rollup({
      input: 'samples/only/main.js',
      onwarn: expectWarnings([
        {
          code: 'UNRESOLVED_IMPORT',
          source: 'test'
        }
      ]),
      plugins: [
        nodeResolve({
          only: [/^@scoped\/.*$/]
        })
      ]
    })
    .then(getBundleImports)
    .then((imports) => assert.deepEqual(imports, ['test'])));
