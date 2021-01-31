# @rollup/plugin-image ChangeLog

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
