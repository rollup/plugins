it('mark as external to module outside the jail', () =>
  rollup
    .rollup({
      input: 'samples/jail/main.js',
      onwarn: expectWarnings([
        {
          code: 'UNRESOLVED_IMPORT',
          source: 'string/uppercase.js'
        }
      ]),
      plugins: [
        nodeResolve({
          jail: `${__dirname}/samples/`
        })
      ]
    })
    .then(getBundleImports)
    .then((imports) => assert.deepEqual(imports, ['string/uppercase.js'])));

it('bundle module defined inside the jail', () =>
  rollup
    .rollup({
      input: 'samples/jail/main.js',
      onwarn: expectNoWarnings,
      plugins: [
        nodeResolve({
          jail: `${__dirname}/`
        })
      ]
    })
    .then(getBundleImports)
    .then((imports) => assert.deepEqual(imports, [])));
