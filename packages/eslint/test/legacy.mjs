import fs from 'fs';
import { createRequire } from 'module';

import { resolve } from 'path';

import test from 'ava';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import { rollup } from 'rollup';

import rollupConfig from '../rollup.config.mjs';

const require = createRequire(import.meta.url);
const __dirname = new URL('.', import.meta.url).pathname;
/**
 * @type {import('current-package').default}
 */
let eslint;

test.before('bundle @rollup/plugin-eslint for legacy eslint tests', async () => {
  const workspaceRoot = resolve(__dirname, '../../../');
  const workspaceEslintPath = resolve(workspaceRoot, 'node_modules/eslint');
  const { main, devDependencies, dependencies } = JSON.parse(fs.readFileSync(resolve(workspaceEslintPath, 'package.json'), 'utf8'));
  const workspaceEslintEntry = resolve(workspaceEslintPath, main)
  await rollup({
    ...rollupConfig,
    external: (rollupConfig.external ?? []).filter((id) => id !== 'eslint'),
    plugins: [
      ...(rollupConfig.plugins ?? []),
      json(),
      nodeResolve({
        // glob v7 causes a circular dependency error
        resolveOnly: [
          ...Object.keys(devDependencies ?? {}).filter((id) => id !== 'glob'),
          ...Object.keys(dependencies ?? {}).filter((id) => id !== 'glob')
        ]
      }),
      commonjs(),
      {
        name: 'resolve-eslint',
        // to bundle eslint v8
        resolveId(id) {
          if (id === 'eslint') {
            return workspaceEslintEntry;
          }
        }
      },
      {
        name: 'hack-commonjs-dynamic-require',
        // a hack solution for dynamic requiring eslint formatters
        footer: `
          function commonjsRequire(path) {
            path = path.replace(/^\\/test/, '')
            return require(resolve(${JSON.stringify(workspaceEslintPath)}, path))
          }
        `
      }
    ]
  })
    .then((b) => b.write({ format: 'cjs', sourcemap: true, file: resolve(__dirname, 'temp.js') }))
  eslint = require(resolve(__dirname, 'temp.js'))
});

test.after.always('cleanup', async () => {
  [resolve(__dirname, 'temp.js'), resolve(__dirname, 'temp.js.map')].forEach((file) => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  })
});

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
        overrideConfigFile: './test/fixtures/.eslintrc-babel',
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
    { message: /Found 1 warning and 1 error/ }
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
    { message: /Found 1 error/ }
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
    { message: /Found 1 warning/ }
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

test('should fail with not found formatter', async (t) => {
  await t.throwsAsync(
    async () => {
      await rollup({
        input: './test/fixtures/use-strict.js',
        plugins: [
          eslint({
            formatter: 'not-found-formatter'
          })
        ]
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

test('should not fail with asynchronous formatter function', async (t) => {
  await rollup({
    input: './test/fixtures/use-strict.js',
    plugins: [
      eslint({
        formatter: async () => 'json'
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
