it('respects order if given module,jsnext:main,main', () =>
  rollup
    .rollup({
      input: 'samples/prefer-module/main.js',
      onwarn: expectNoWarnings,
      plugins: [
        nodeResolve({ mainFields: ['module', 'jsnext:main', 'main'], preferBuiltins: false })
      ]
    })
    .then(executeBundle)
    .then((module) => {
      assert.equal(module.exports, 'MODULE-ENTRY');
    }));

    it('finds and uses a dual-distributed .js & .mjs module', () =>
      rollup
        .rollup({
          input: 'samples/dual-cjs-mjs/main.js',
          onwarn: expectNoWarnings,
          plugins: [nodeResolve({ preferBuiltins: false })]
        })
        .then(executeBundle)
        .then((module) => {
          assert.equal(module.exports, 'DUAL-MJS');
        }));

    it('keeps the order of [browser, module, jsnext, main] with all enabled', () =>
      rollup
        .rollup({
          input: 'samples/browser/main.js',
          plugins: [nodeResolve({ main: true, browser: true, jsnext: true, module: true })]
        })
        .then(executeBundle)
        .then((module) => {
          assert.equal(module.exports, 'browser');
        }));

        it('respects order if given jsnext:main, main', () =>
          rollup
            .rollup({
              input: 'samples/prefer-jsnext/main.js',
              onwarn: expectNoWarnings,
              plugins: [nodeResolve({ mainFields: ['jsnext:main', 'main'], preferBuiltins: false })]
            })
            .then(executeBundle)
            .then((module) => {
              assert.equal(module.exports, 'JSNEXT-ENTRY');
            }));
