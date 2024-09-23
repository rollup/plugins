# @rollup/plugin-replace ChangeLog

## v5.0.7

_2024-06-05_

### Bugfixes

- fix: add missing sourceMap documentation (#1698)

## v5.0.6

_2024-06-05_

### Bugfixes

- fix: ternary operator replacement (#1712)

## v5.0.5

_2023-10-29_

### Bugfixes

- fix: prevent variable before colons from being replaced when preventAssigment is true (#1609)

## v5.0.4

_2023-10-15_

### Bugfixes

- fix: bump magic-string version [#1596](https://github.com/rollup/plugins/pull/1596)

## v5.0.3

_2023-10-05_

### Bugfixes

- fix: ensure rollup 4 compatibility [#1595](https://github.com/rollup/plugins/pull/1595)

## v5.0.2

_2022-12-17_

### Bugfixes

- fix: update magic-string [#1373](https://github.com/rollup/plugins/pull/1373)

## v5.0.1

_2022-10-21_

### Updates

- chore: update rollup dependencies ([3038271](https://github.com/rollup/plugins/commit/303827191ede6b2e4eade96c6968ed16a587683f))

## v5.0.0

_2022-10-10_

### Breaking Changes

- fix: prepare for Rollup 3 [#1286](https://github.com/rollup/plugins/pull/1286)

## v4.0.0

_2022-02-22_

### Breaking Changes

- fix: do not escape delimiters (#1088)

## v3.1.0

_2022-02-11_

### Features

- feat: typeofReplacements option (#1084)

## v3.0.1

_2021-12-28_

### Bugfixes

- fix: add types for `sourceMap` option (#1066)

### Updates

- docs: clarify delimiters typing (#1013)

## v3.0.0

_2021-07-16_

### Breaking Changes

- fix!: issues with nested objects replacements (#903)

## v2.4.2

_2021-03-26_

### Updates

- docs: document the `values` option (#814)

## v2.4.1

_2021-02-22_

### Bugfixes

- fix: add missing types for new `preventAssignment` option (#813)

## v2.4.0

_2021-02-22_

### Features

- feat: prevent accidental replacement within assignment (#798)

### Updates

- docs: clarify replacement. fixes #737 (#785)

## v2.3.4

_2020-10-27_

### Updates

- docs: describe process.env.NODE_ENV case (#589)
- chore: update dependencies (53e2b73)
- docs: linting update in readme (aef7dbc)

## v2.3.3

_2020-06-05_

### Updates

- docs: clarify options for allowed replacement values (#422)

## v2.3.2

_2020-04-19_

### Updates

- chore: add rollup 2 to peer range (3e0d775)

## v2.3.1

_2020-02-01_

### Updates

- chore: update dependencies (aca4a94)

## 2.3.0

_2019-12-21_

- feat(replace): allow plugin to operate as an output plugin (#55)

## 2.2.1

_2019-11-06_

- Move `typescript` to `devDependencies`

## 2.2.0

_2019-04-10_

- Add index.d.ts typings file ([#31](https://github.com/rollup/rollup-plugin-replace/pull/31))

## 2.1.1

_2019-03-18_

- Update rollup-pluginutils ([#29](https://github.com/rollup/rollup-plugin-replace/pull/29))
- Update dependencies ([#30](https://github.com/rollup/rollup-plugin-replace/pull/30))

## 2.1.0

_2018-10-07_

- Do not mutate values passed as option ([#22](https://github.com/rollup/rollup-plugin-replace/pull/22))
- Update dependencies and improve tests ([#26](https://github.com/rollup/rollup-plugin-replace/pull/26))

## 2.0.0

- Only match on word boundaries, unless delimiters are empty strings ([#10](https://github.com/rollup/rollup-plugin-replace/pull/10))

## 1.2.1

- Match longest keys first ([#8](https://github.com/rollup/rollup-plugin-replace/pull/8))
- Escape keys ([#9](https://github.com/rollup/rollup-plugin-replace/pull/9))

## 1.2.0

- Allow replacement to be a function that takes a module ID ([#1](https://github.com/rollup/rollup-plugin-replace/issues/1))

## 1.1.1

- Return a `name`

## 1.1.0

- Generate sourcemaps by default

## 1.0.1

- Include correct files in package

## 1.0.0

- First release
