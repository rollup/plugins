import fs from 'fs';

import test from 'ava';
import nodeResolve from '@rollup/plugin-node-resolve';
import { rollup } from 'rollup';

import eslint from '../dist';

test('should lint files', async (t) => {
  let count = 0;
  await rollup({
    input: './test/fixtures/undeclared.js',
    plugins: [
      eslint({
        formatter: (results) => {
          count += results[0].messages.length;
          // eslint-disable-next-line prefer-destructuring
          const { message } = results[0].messages[0];
          t.is(message, "'x' is not defined.");
        }
      })
    ]
  });

  t.is(count, 1);
});

test('should not fail with default options', async (t) => {
  await rollup({
    input: './test/fixtures/undeclared.js',
    plugins: [eslint()]
  });

  t.pass();
});

test('should ignore node_modules with exclude option', async (t) => {
  let count = 0;
  await rollup({
    input: './test/fixtures/modules.js',
    plugins: [
      nodeResolve({ jsnext: true }),
      eslint({
        configFile: './test/fixtures/.eslintrc-babel',
        formatter: () => {
          count += 1;
        }
      })
    ]
  });

  t.is(count, 0);
});

test('should ignore files according .eslintignore', async (t) => {
  let count = 0;
  await rollup({
    input: './test/fixtures/ignored.js',
    plugins: [
      eslint({
        formatter: () => {
          count += 1;
        }
      })
    ]
  });

  t.is(count, 0);
});

test('should fail with enabled throwOnWarning and throwOnError options', async (t) => {
  await t.throwsAsync(
    async () => {
      await rollup({
        input: './test/fixtures/use-strict.js',
        plugins: [
          eslint({
            throwOnWarning: true,
            throwOnError: true,
            formatter: () => ''
          })
        ]
      });
    },
    { message: /Warnings or errors were found/ }
  );
});

test('should fail with enabled throwOnError option', async (t) => {
  await t.throwsAsync(
    async () => {
      await rollup({
        input: './test/fixtures/use-strict.js',
        plugins: [
          eslint({
            throwOnError: true,
            formatter: () => ''
          })
        ]
      });
    },
    { message: /Errors were found/ }
  );
});

test('should fail with enabled throwOnWarning option', async (t) => {
  await t.throwsAsync(
    async () => {
      await rollup({
        input: './test/fixtures/use-strict.js',
        plugins: [
          eslint({
            throwOnWarning: true,
            formatter: () => ''
          })
        ]
      });
    },
    { message: /Warnings were found/ }
  );
});

test('should not fail with throwOnError and throwOnWarning disabled', async (t) => {
  await rollup({
    input: './test/fixtures/use-strict.js',
    plugins: [
      eslint({
        throwOnError: false,
        throwOnWarning: false,
        formatter: () => ''
      })
    ]
  });

  t.pass();
});

test('should fail with not found formatter', (t) => {
  t.throws(
    () => {
      eslint({
        formatter: 'not-found-formatter'
      });
    },
    { message: /There was a problem loading formatter/ }
  );
});

test('should not fail with found formatter', async (t) => {
  rollup({
    input: './test/fixtures/use-strict.js',
    plugins: [
      eslint({
        formatter: 'stylish'
      })
    ]
  });

  t.pass();
});

test('should fix source code', async (t) => {
  fs.writeFileSync(
    './test/fixtures/fixable-clone.js',
    fs.readFileSync('./test/fixtures/fixable.js')
  );

  await rollup({
    input: './test/fixtures/fixable-clone.js',
    plugins: [
      eslint({
        fix: true
      })
    ]
  });

  t.is(
    fs.readFileSync('./test/fixtures/fixable-clone.js').toString(),
    fs.readFileSync('./test/fixtures/fixed.js').toString()
  );

  fs.unlinkSync('./test/fixtures/fixable-clone.js');
});
