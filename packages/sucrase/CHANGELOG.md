# @rollup/plugin-sucrase ChangeLog

## v4.0.4

_2022-05-14_

### Bugfixes

- fix: use bare specifier to obtain SucraseOptions type (#1185)

## v4.0.3

_2022-04-13_

### Bugfixes

- fix: allow js files for TypeScript resolutuon (#1019)

## v4.0.2

_2022-01-05_

### Updates

- test: skip test on Windows (f95bc18)

## v4.0.1

_2021-10-01_

### Bugfixes

- fix: Pass `disableESTransforms` option and make types match options we support (#984)

## v4.0.0

_2021-07-26_

### Breaking Changes

- chore: upgrade sucrase dependency (#938)

## v3.1.1

_2021-07-26_

### Updates

- chore update dependencies (5f07d35)

## v3.1.0

_2020-06-28_

### Features

- feat: resolve .tsx files (#448)

## v3.0.2

_2020-05-20_

### Bugfixes

- fix: fix aliases not resolving (#387)

## v3.0.1

_2020-05-11_

### Updates

- chore: rollup v2 peerDep. (dupe for pub) (ad08841)

## 3.0.0

_2019-12-??_

- **Breaking:** Minimum compatible Rollup version is 1.20.0
- **Breaking:** Minimum supported Node version is 8.0.0
- Published as @rollup/plugin-sucrase
- Fix: correctly pass `enableLegacyBabel5ModuleInterop` option to Sucrase

## 2.1.0

- Add `filter` option ([#4](https://github.com/rollup/rollup-plugin-sucrase/pull/4))
- Remove lockfile so we always get most recent version of Sucrase
- Resolve extensionless imports ([#3](https://github.com/rollup/rollup-plugin-sucrase/issues/3))

## 2.0.0

- Update to Sucrase 3.x ([#2](https://github.com/rollup/rollup-plugin-sucrase/pull/2))

## 1.0.0

- First release
