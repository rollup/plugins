describe('getPackageInfoForId', () => {
  it('populates info for main', () => {
    const resolve = nodeResolve({
      mainFields: ['main']
    });

    let entriesInfo;

    return rollup
      .rollup({
        input: 'samples/prefer-main/main.js',
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
      })
      .then(() => {
        const entriesPkgJsonPath = path.resolve(__dirname, './node_modules/entries/package.json');
        const root = path.dirname(entriesPkgJsonPath);
        assert.deepStrictEqual(entriesInfo, {
          browserMappedMain: false,
          resolvedMainField: 'main',
          packageJson: require(entriesPkgJsonPath),
          packageJsonPath: entriesPkgJsonPath,
          root,
          resolvedEntryPoint: path.resolve(root, './main-entry.js')
        });
      });
  });

  it('populates info for module', () => {
    const resolve = nodeResolve({
      mainFields: ['module']
    });

    let entriesInfo;

    return rollup
      .rollup({
        input: 'samples/prefer-main/main.js',
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
      })
      .then(() => {
        const entriesPkgJsonPath = path.resolve(__dirname, './node_modules/entries/package.json');
        const root = path.dirname(entriesPkgJsonPath);

        assert.deepStrictEqual(entriesInfo, {
          browserMappedMain: false,
          resolvedMainField: 'module',
          packageJson: require(entriesPkgJsonPath),
          packageJsonPath: entriesPkgJsonPath,
          root,
          resolvedEntryPoint: path.resolve(root, './module-entry.js')
        });
      });
  });

  it('populates info for browser', () => {
    const resolve = nodeResolve({
      mainFields: ['browser']
    });

    const entriesInfoMap = new Map();

    return rollup
      .rollup({
        input: 'samples/browser-object/main.js',
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
      })
      .then(() => {
        const entriesPkgJsonPath = path.resolve(
          __dirname,
          './node_modules/isomorphic-object/package.json'
        );
        const root = path.dirname(entriesPkgJsonPath);
        const expectedPkgJson = require(entriesPkgJsonPath);

        for (const entriesInfo of entriesInfoMap.values()) {
          assert.deepStrictEqual(entriesInfo, {
            browserMappedMain: true,
            resolvedMainField: 'main',
            packageJson: expectedPkgJson,
            packageJsonPath: entriesPkgJsonPath,
            root,
            resolvedEntryPoint: path.resolve(root, './browser.js')
          });
        }
      });
  });
});
