# @rollup/plugin-image ChangeLog

## v3.0.3

_2023-10-05_

### Bugfixes

- fix: ensure rollup 4 compatibility [#1595](https://github.com/rollup/plugins/pull/1595)

## v3.0.2

_2023-01-20_

### Bugfixes

- fix: types should come first in exports [#1403](https://github.com/rollup/plugins/pull/1403)

## v3.0.1

_2022-10-21_

### Updates

- chore: update rollup dependencies ([3038271](https://github.com/rollup/plugins/commit/303827191ede6b2e4eade96c6968ed16a587683f))

## v3.0.0

_2022-10-09_

### Breaking Changes

- fix: prepare for Rollup 3 [#1293](https://github.com/rollup/plugins/pull/1293)

## v2.1.1

_2021-08-24_

### Bugfixes

- fix: include types, not tests, in package.json files (#982)

## v2.1.0

_2021-07-26_

### Features

- feat: add typings (#898)

## v2.0.6

_2020-12-14_

### Bugfixes

- fix: use 'var' instead of 'const' (#691)

### Updates

- chore: update dependencies (0c57b08)

## v2.0.5

_2020-05-11_

### Updates

- chore: rollup v2 peerDep. (dupe for pub) (a3f3205)

## v2.0.4

_2020-02-04_

### Bugfixes

- fix: url-encode SVG source (#173)

## v2.0.3

_2020-02-04_

### Bugfixes

- fix: url-encode SVG source (#173)

## v2.0.2

_2020-02-01_

### Updates

- chore: update dependencies (1913e7f)

## v2.0.1

_2020-01-07_

### Bugfixes

- fix: don't encode svg as base64 (#136)

## 2.0.0

- **Breaking:** Minimum compatible Rollup version is 1.20.0
- **Breaking:** Minimum supported Node version is 8.0.0
- **Breaking:** Plugin will generate a `const` variable for exporting the image by default. To obtain the old default functionality, use the `dom: true` option.
- Published under @rollup/plugins-image
- WebP added to recognized MIME types
- Added `dom` option

## 1.0.2

- Return a `name`

## 1.0.1

- Fix `pkg.files`
- Generate synthetic AST, for quicker parsing

## 1.0.0

- First Release
