import fs from 'fs';
import { createRequire } from 'module';
import process from 'process';
import path from 'path';
import { fileURLToPath } from 'url';

import eslint9 from 'eslint9';
import esmock from 'esmock';
import { test, expect } from 'vitest';
import nodeResolve from '@rollup/plugin-node-resolve';
import { rollup } from 'rollup';

import eslint from 'current-package';

test('should lint files', async () => {
  let count = 0;
  await rollup({
    input: './test/fixtures/legacy-config/undeclared.js',
    plugins: [
      eslint({
        formatter: (results) => {
          count += results[0].messages.length;
          // eslint-disable-next-line prefer-destructuring
          const { message } = results[0].messages[0];
          expect(message).toBe("'x' is not defined.");
        }
      })
    ]
  });

  expect(count).toBe(1);
});

test('should not fail with default options', async () => {
  await rollup({
    input: './test/fixtures/legacy-config/undeclared.js',
    plugins: [eslint()]
  });
});

test('should ignore node_modules with exclude option', async () => {
  let count = 0;
  await rollup({
    input: './test/fixtures/legacy-config/modules.js',
    plugins: [
      nodeResolve({ jsnext: true }),
      eslint({
        overrideConfigFile: './test/fixtures/legacy-config/.eslintrc-babel',
        formatter: () => {
          count += 1;
        }
      })
    ]
  });

  expect(count).toBe(0);
});

test('should ignore files according .eslintignore', async () => {
  let count = 0;
  await rollup({
    input: './test/fixtures/legacy-config/ignored.js',
    plugins: [
      eslint({
        formatter: () => {
          count += 1;
        }
      })
    ]
  });

  expect(count).toBe(0);
});

test('should fail with enabled throwOnWarning and throwOnError options', async () => {
  await expect(
    rollup({
      input: './test/fixtures/legacy-config/use-strict.js',
      plugins: [
        eslint({
          throwOnWarning: true,
          throwOnError: true,
          formatter: () => ''
        })
      ]
    })
  ).rejects.toThrow(/Found 1 warning and 1 error/);
});

test('should fail with enabled throwOnError option', async () => {
  await expect(
    rollup({
      input: './test/fixtures/legacy-config/use-strict.js',
      plugins: [
        eslint({
          throwOnError: true,
          formatter: () => ''
        })
      ]
    })
  ).rejects.toThrow(/Found 1 error/);
});

test('should fail with enabled throwOnWarning option', async () => {
  await expect(
    rollup({
      input: './test/fixtures/legacy-config/use-strict.js',
      plugins: [
        eslint({
          throwOnWarning: true,
          formatter: () => ''
        })
      ]
    })
  ).rejects.toThrow(/Found 1 warning/);
});

test('should not fail with throwOnError and throwOnWarning disabled', async () => {
  await rollup({
    input: './test/fixtures/legacy-config/use-strict.js',
    plugins: [
      eslint({
        throwOnError: false,
        throwOnWarning: false,
        formatter: () => ''
      })
    ]
  });
});

test('should fail with not found formatter', async () => {
  await expect(
    rollup({
      input: './test/fixtures/legacy-config/use-strict.js',
      plugins: [
        eslint({
          formatter: 'not-found-formatter'
        })
      ]
    })
  ).rejects.toThrow(/There was a problem loading formatter/);
});

test('should not fail with found formatter', async () => {
  await rollup({
    input: './test/fixtures/legacy-config/use-strict.js',
    plugins: [
      eslint({
        formatter: 'stylish'
      })
    ]
  });
});

test('should not fail with asynchronous formatter function', async () => {
  await rollup({
    input: './test/fixtures/legacy-config/use-strict.js',
    plugins: [
      eslint({
        formatter: async () => 'json'
      })
    ]
  });
});

test('should fix source code', async () => {
  fs.writeFileSync(
    './test/fixtures/legacy-config/fixable-clone.js',
    fs.readFileSync('./test/fixtures/legacy-config/fixable.js')
  );

  await rollup({
    input: './test/fixtures/legacy-config/fixable-clone.js',
    plugins: [
      eslint({
        fix: true
      })
    ]
  });

  expect(fs.readFileSync('./test/fixtures/legacy-config/fixable-clone.js').toString()).toBe(
    fs.readFileSync('./test/fixtures/legacy-config/fixed.js').toString()
  );

  fs.unlinkSync('./test/fixtures/legacy-config/fixable-clone.js');
});

test('works with cjs plugin', async () => {
  const require = createRequire(import.meta.url);
  const eslintPluginCjs = require('current-package');
  let count = 0;
  await rollup({
    input: './test/fixtures/legacy-config/undeclared.js',
    plugins: [
      eslintPluginCjs({
        formatter: (results) => {
          count += results[0].messages.length;
          // eslint-disable-next-line prefer-destructuring
          const { message } = results[0].messages[0];
          expect(message).toBe("'x' is not defined.");
        }
      })
    ]
  });

  expect(count).toBe(1);
});

test('works with flat config', async () => {
  let count = 0;
  await rollup({
    input: './test/fixtures/flat-config/undeclared.js',
    plugins: [
      eslint({
        formatter: (results) => {
          count += results[0].messages.length;
          // eslint-disable-next-line prefer-destructuring
          const { message } = results[0].messages[0];
          expect(message).toBe("'x' is not defined.");
        }
      })
    ]
  });

  expect(count).toBe(1);
}, 15_000);

test('works with ESLint v9', async () => {
  // Load the plugin with an override to route 'eslint' imports to ESLint v9
  const eslint = await esmock('current-package', {
    eslint: eslint9
  });

  // ESLint v9 needs to be invoked with a flat config file in the current dir
  const cwd = process.cwd();
  const testDir = path.dirname(fileURLToPath(import.meta.url));
  process.chdir(path.join(testDir, 'fixtures', 'flat-config'));

  let count = 0;
  try {
    await rollup({
      input: './undeclared.js',
      plugins: [
        eslint({
          formatter: (results) => {
            count += results[0].messages.length;
            // eslint-disable-next-line prefer-destructuring
            const { message } = results[0].messages[0];
            expect(message).toBe("'x' is not defined.");
          }
        })
      ]
    });
  } finally {
    process.chdir(cwd);
  }

  expect(count).toBe(1);
});
