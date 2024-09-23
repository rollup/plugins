# @rollup/plugin-json ChangeLog

## v6.1.0

_2023-12-12_

### Features

- feat: add `includeArbitraryNames` option (#1641)

## v6.0.1

_2023-10-05_

### Bugfixes

- fix: ensure rollup 4 compatibility [#1595](https://github.com/rollup/plugins/pull/1595)

## v6.0.0

_2022-12-17_

### Breaking Changes

- fix: log more robustly when JSON parsing fails [#1361](https://github.com/rollup/plugins/pull/1361)

## v5.0.2

_2022-11-27_

### Updates

- docs: correct minimatch to picomatch [#1332](https://github.com/rollup/plugins/pull/1332)

## v5.0.1

_2022-10-21_

### Updates

- chore: update rollup dependencies ([3038271](https://github.com/rollup/plugins/commit/303827191ede6b2e4eade96c6968ed16a587683f))

## v5.0.0

_2022-10-10_

### Breaking Changes

- fix: prepare for Rollup 3 [#1291](https://github.com/rollup/plugins/pull/1291)

### Updates

- chore: update dependencies ([678125b](https://github.com/rollup/plugins/commit/678125b5396bd3e8193c39d7d90e33d3f76cf7d8))

## v4.1.0

_2020-06-05_

### Features

- feat: log the filename when JSON.parse fails (#417)

## v4.0.3

_2020-04-19_

### Updates

- chore: add rollup 2 to peer range (06d9d29)

## v4.0.2

_2020-02-01_

### Bugfixes

- fix: correct type definitions (#161)

### Updates

- chore: update dependencies (e1d317b)

## 4.0.1

_2019-12-21_

- fix(json): cannot be imported by rollup (#81)

## 4.0.0

_2019-03-18_

- Pass all JSON data through dataToEsm to consistently support "compact" formatting, support empty keys, abandon Node 4 support, add prettier, update dependencies ([#53](https://github.com/rollup/rollup-plugin-json/issues/53))

## 3.1.0

_2018-09-13_

- Expose "compact" and "namedExports" options ([#45](https://github.com/rollup/rollup-plugin-json/issues/45))
- Update rollup-pluginutils to support null values in JSON ([#44](https://github.com/rollup/rollup-plugin-json/issues/44))
- Update dependencies and ensure rollup@1.0 compatibility ([#46](https://github.com/rollup/rollup-plugin-json/issues/46))

## 3.0.0

_2018-05-11_

- No longer create a fake AST to support tree-shaking with upcoming versions of rollup ([#41](https://github.com/rollup/rollup-plugin-json/issues/41))

## 2.3.1

_2018-05-11_

- Update example in readme ([#38](https://github.com/rollup/rollup-plugin-json/issues/38))
- Warn when using this version with upcoming rollup versions

## 2.3.0

_2017-06-03_

- Always parse JSON, so malformed JSON is identified at bundle time ([#27](https://github.com/rollup/rollup-plugin-json/issues/27))

## 2.2.0

_2017-06-03_

- Add `indent` option ([#24](https://github.com/rollup/rollup-plugin-json/issues/24))

## 2.1.1

_2017-04-09_

- Add license to package.json ([#25](https://github.com/rollup/rollup-plugin-json/pull/25))

## 2.1.0

_2016-12-15_

- Add support for `preferConst` option ([#16](https://github.com/rollup/rollup-plugin-json/pull/16))
- Handle JSON files with no valid identifier keys ([#19](https://github.com/rollup/rollup-plugin-json/issues/19))

## 2.0.2

_2016-09-07_

- Generate correct fake AST

## 2.0.1

_2016-06-23_

- Return a `name`

## 2.0.0

_2015-11-05_

- Generate fake AST to avoid unnecessary traversals within Rollup

## 1.1.0

_unpublished_

- Generate named exports alongside default exports

## 1.0.0

_2015-10-25_

- First release
