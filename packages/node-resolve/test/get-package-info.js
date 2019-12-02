/* eslint-disable consistent-return, import/no-dynamic-require, global-require */

const path = require('path');

const test = require('ava');
const { rollup } = require('rollup');

const nodeResolve = require('..');

process.chdir(path.join(__dirname, 'fixtures'));

test('populates info for main', async (t) => {
  const resolve = nodeResolve({
    mainFields: ['main']
  });

  let entriesInfo;

  await rollup({
    input: 'prefer-main.js',
    plugins: [
      resolve,
      {
        transform(code, id) {
          if (!id.match(/main-entry.js$/)) return;
          entriesInfo = resolve.getPackageInfoForId(id);
          return code;
        }
      }
    ]
  });

  const entriesPkgJsonPath = path.resolve('node_modules/entries/package.json');
  const root = path.dirname(entriesPkgJsonPath);

  t.deepEqual(entriesInfo, {
    browserMappedMain: false,
    resolvedMainField: 'main',
    packageJson: require(entriesPkgJsonPath),
    packageJsonPath: entriesPkgJsonPath,
    root,
    resolvedEntryPoint: path.resolve(root, './main-entry.js')
  });
});

test('populates info for module', async (t) => {
  const resolve = nodeResolve({
    mainFields: ['module']
  });

  let entriesInfo;

  await rollup({
    input: 'prefer-main.js',
    plugins: [
      resolve,
      {
        transform(code, id) {
          if (!id.match(/module-entry.js$/)) return;
          entriesInfo = resolve.getPackageInfoForId(id);
          return code;
        }
      }
    ]
  });

  const entriesPkgJsonPath = path.resolve('node_modules/entries/package.json');
  const root = path.dirname(entriesPkgJsonPath);

  t.deepEqual(entriesInfo, {
    browserMappedMain: false,
    resolvedMainField: 'module',
    packageJson: require(entriesPkgJsonPath),
    packageJsonPath: entriesPkgJsonPath,
    root,
    resolvedEntryPoint: path.resolve(root, './module-entry.js')
  });
});

test('populates info for browser', async (t) => {
  const resolve = nodeResolve({
    mainFields: ['browser']
  });

  const entriesInfoMap = new Map();

  await rollup({
    input: 'browser-object.js',
    plugins: [
      resolve,
      {
        transform(code, id) {
          if (!id.match(/isomorphic-object/)) return;
          entriesInfoMap.set(id, resolve.getPackageInfoForId(id));
          return code;
        }
      }
    ]
  });

  const entriesPkgJsonPath = path.resolve('node_modules/isomorphic-object/package.json');
  const root = path.dirname(entriesPkgJsonPath);
  const expectedPkgJson = require(entriesPkgJsonPath);

  for (const entriesInfo of entriesInfoMap.values()) {
    t.deepEqual(entriesInfo, {
      browserMappedMain: true,
      resolvedMainField: 'main',
      packageJson: expectedPkgJson,
      packageJsonPath: entriesPkgJsonPath,
      root,
      resolvedEntryPoint: path.resolve(root, './browser.js')
    });
  }
});
