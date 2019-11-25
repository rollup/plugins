it('single module version is bundle if dedupe is set', () =>
  rollup
    .rollup({
      input: 'samples/react-app/main.js',
      plugins: [
        nodeResolve({
          dedupe: ['react']
        })
      ]
    })
    .then(executeBundle)
    .then((module) => {
      assert.deepEqual(module.exports, {
        React: 'react:root',
        ReactConsumer: 'react-consumer:react:root'
      });
    }));

it('single module version is bundle if dedupe is set as a function', () =>
  rollup
    .rollup({
      input: 'samples/react-app/main.js',
      plugins: [
        nodeResolve({
          dedupe: (dep) => dep === 'react'
        })
      ]
    })
    .then(executeBundle)
    .then((module) => {
      assert.deepEqual(module.exports, {
        React: 'react:root',
        ReactConsumer: 'react-consumer:react:root'
      });
    }));

it('multiple module versions are bundled if dedupe is not set', () =>
  rollup
    .rollup({
      input: 'samples/react-app/main.js',
      plugins: [nodeResolve()]
    })
    .then(executeBundle)
    .then((module) => {
      assert.deepEqual(module.exports, {
        React: 'react:root',
        ReactConsumer: 'react-consumer:react:child'
      });
    }));
