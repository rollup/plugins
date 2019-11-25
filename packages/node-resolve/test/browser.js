it('disregards top-level browser field', () =>
  rollup
    .rollup({
      input: 'samples/browser/main.js',
      onwarn: expectNoWarnings,
      plugins: [nodeResolve()]
    })
    .then(executeBundle)
    .then((module) => {
      assert.equal(module.exports, 'node');
    }));

it('allows use of the top-level browser field', () =>
  rollup
    .rollup({
      input: 'samples/browser/main.js',
      onwarn: expectNoWarnings,
      plugins: [
        nodeResolve({
          mainFields: ['browser', 'main']
        })
      ]
    })
    .then(executeBundle)
    .then((module) => {
      assert.equal(module.exports, 'browser');
    }));

it('disregards object browser field', () =>
  rollup
    .rollup({
      input: 'samples/browser-object/main.js',
      onwarn: expectNoWarnings,
      plugins: [nodeResolve()]
    })
    .then(executeBundle)
    .then((module) => {
      assert.equal(module.exports.env, 'node');
      assert.equal(module.exports.dep, 'node-dep');
      assert.equal(module.exports.test, 42);
    }));

it('allows use of the object browser field', () =>
  rollup
    .rollup({
      input: 'samples/browser-object/main.js',
      onwarn: expectNoWarnings,
      plugins: [
        nodeResolve({
          mainFields: ['browser', 'main']
        })
      ]
    })
    .then(executeBundle)
    .then((module) => {
      assert.equal(module.exports.env, 'browser');
      assert.equal(module.exports.dep, 'browser-dep');
      assert.equal(module.exports.test, 43);
    }));

it('allows use of object browser field, resolving `main`', () =>
  rollup
    .rollup({
      input: 'samples/browser-object-main/main.js',
      onwarn: expectNoWarnings,
      plugins: [
        nodeResolve({
          mainFields: ['browser', 'main']
        })
      ]
    })
    .then(executeBundle)
    .then((module) => {
      assert.equal(module.exports.env, 'browser');
      assert.equal(module.exports.dep, 'browser-dep');
      assert.equal(module.exports.test, 43);
    }));

it('options.browser = true still works', () =>
  rollup
    .rollup({
      input: 'samples/browser-object-main/main.js',
      plugins: [
        nodeResolve({
          browser: true
        })
      ]
    })
    .then(executeBundle)
    .then((module) => {
      assert.equal(module.exports.env, 'browser');
      assert.equal(module.exports.dep, 'browser-dep');
      assert.equal(module.exports.test, 43);
    }));

it('allows use of object browser field, resolving implicit `main`', () =>
  rollup
    .rollup({
      input: 'samples/browser-object/main-implicit.js',
      onwarn: expectNoWarnings,
      plugins: [
        nodeResolve({
          mainFields: ['browser', 'main']
        })
      ]
    })
    .then(executeBundle)
    .then((module) => {
      assert.equal(module.exports.env, 'browser');
    }));

it('allows use of object browser field, resolving replaced builtins', () =>
  rollup
    .rollup({
      input: 'samples/browser-object-builtin/main.js',
      onwarn: expectNoWarnings,
      plugins: [
        nodeResolve({
          mainFields: ['browser', 'main']
        })
      ]
    })
    .then(executeBundle)
    .then((module) => {
      assert.equal(module.exports, 'browser-fs');
    }));

it('allows use of object browser field, resolving nested directories', () =>
  rollup
    .rollup({
      input: 'samples/browser-object-nested/main.js',
      onwarn: expectNoWarnings,
      plugins: [
        nodeResolve({
          mainFields: ['browser', 'main']
        })
      ]
    })
    .then(executeBundle)
    .then((module) => {
      assert.equal(module.exports.env, 'browser');
      assert.equal(module.exports.dep, 'browser-dep');
      assert.equal(module.exports.test, 43);
    }));

it('allows use of object browser field, resolving `main`', () =>
  rollup
    .rollup({
      input: 'samples/browser-object-main/main.js',
      onwarn: expectNoWarnings,
      plugins: [
        nodeResolve({
          mainFields: ['browser', 'main']
        })
      ]
    })
    .then(executeBundle)
    .then((module) => {
      assert.equal(module.exports.env, 'browser');
      assert.equal(module.exports.dep, 'browser-dep');
      assert.equal(module.exports.test, 43);
    }));

it('allows use of object browser field, resolving implicit `main`', () =>
  rollup
    .rollup({
      input: 'samples/browser-object/main-implicit.js',
      onwarn: expectNoWarnings,
      plugins: [
        nodeResolve({
          mainFields: ['browser', 'main']
        })
      ]
    })
    .then(executeBundle)
    .then((module) => {
      assert.equal(module.exports.env, 'browser');
    }));

it('allows use of object browser field, resolving replaced builtins', () =>
  rollup
    .rollup({
      input: 'samples/browser-object-builtin/main.js',
      onwarn: expectNoWarnings,
      plugins: [
        nodeResolve({
          mainFields: ['browser', 'main']
        })
      ]
    })
    .then(executeBundle)
    .then((module) => {
      assert.equal(module.exports, 'browser-fs');
    }));

it('respects local browser field', () =>
  rollup
    .rollup({
      input: 'samples/browser-local/main.js',
      onwarn: expectNoWarnings,
      plugins: [
        nodeResolve({
          mainFields: ['browser', 'main']
        })
      ]
    })
    .then(executeBundle)
    .then((module) => {
      assert.equal(module.exports, 'component-type');
    }));

    it('allows use of object browser field, resolving nested directories', () =>
      rollup
        .rollup({
          input: 'samples/browser-object-nested/main.js',
          onwarn: expectNoWarnings,
          plugins: [
            nodeResolve({
              mainFields: ['browser', 'main']
            })
          ]
        })
        .then(executeBundle)
        .then((module) => {
          assert.equal(module.exports.env, 'browser');
          assert.equal(module.exports.dep, 'browser-dep');
          assert.equal(module.exports.test, 43);
        }));

    it('allows use of object browser field, resolving `main`', () =>
      rollup
        .rollup({
          input: 'samples/browser-object-main/main.js',
          onwarn: expectNoWarnings,
          plugins: [
            nodeResolve({
              mainFields: ['browser', 'main']
            })
          ]
        })
        .then(executeBundle)
        .then((module) => {
          assert.equal(module.exports.env, 'browser');
          assert.equal(module.exports.dep, 'browser-dep');
          assert.equal(module.exports.test, 43);
        }));

    it('allows use of object browser field, resolving implicit `main`', () =>
      rollup
        .rollup({
          input: 'samples/browser-object/main-implicit.js',
          onwarn: expectNoWarnings,
          plugins: [
            nodeResolve({
              mainFields: ['browser', 'main']
            })
          ]
        })
        .then(executeBundle)
        .then((module) => {
          assert.equal(module.exports.env, 'browser');
        }));

    it('allows use of object browser field, resolving replaced builtins', () =>
      rollup
        .rollup({
          input: 'samples/browser-object-builtin/main.js',
          onwarn: expectNoWarnings,
          plugins: [
            nodeResolve({
              mainFields: ['browser', 'main']
            })
          ]
        })
        .then(executeBundle)
        .then((module) => {
          assert.equal(module.exports, 'browser-fs');
        }));

    it('allows use of object browser field, resolving nested directories', () =>
      rollup
        .rollup({
          input: 'samples/browser-object-nested/main.js',
          onwarn: expectNoWarnings,
          plugins: [
            nodeResolve({
              mainFields: ['browser', 'main']
            })
          ]
        })
        .then(executeBundle)
        .then((module) => {
          assert.equal(module.exports.env, 'browser');
          assert.equal(module.exports.dep, 'browser-dep');
          assert.equal(module.exports.test, 43);
        }));

    it('allows use of object browser field, resolving to nested node_modules', () =>
      rollup
        .rollup({
          input: 'samples/browser-entry-points-to-node-module/index.js',
          onwarn: expectNoWarnings,
          plugins: [
            nodeResolve({
              main: true,
              browser: true
            })
          ]
        })
        .then(executeBundle)
        .then((module) => {
          assert.equal(module.exports, 'component-type');
        }));

    it('supports `false` in browser field', () =>
      rollup
        .rollup({
          input: 'samples/browser-false/main.js',
          onwarn: expectNoWarnings,
          plugins: [
            nodeResolve({
              mainFields: ['browser', 'main']
            })
          ]
        })
        .then(executeBundle));

        it('pkg.browser with mapping to prevent bundle by specifying a value of false', () =>
          rollup
            .rollup({
              input: 'samples/browser-object-with-false/main.js',
              plugins: [nodeResolve({ browser: true }), commonjs()]
            })
            .then(executeBundle)
            .then((module) => {
              assert.equal(module.exports, 'ok');
            }));
