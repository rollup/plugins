# @rollup/plugin-strip ChangeLog

## v2.1.0

_2021-07-26_

### Features

- feat: add typings (#898)

## v2.0.1

_2021-05-07_

### Updates

- chore: update dependencies (7ff3d0c)

## v2.0.0

_2020-07-12_

### Breaking Changes

- feat!: support specifying both functions and labels (#471)

### Updates

- docs: update README (#458)

## v1.3.3

_2020-05-11_

### Updates

- chore: rollup v2 peerDep. (dupe for pub) (628f8c7)

## v1.3.2

_2020-02-01_

### Updates

- chore: update dependencies (059d1f2)

## 1.2.2

- Fix object destructuring assignments with default values ([#17](https://github.com/rollup/@rollup/plugin-strip/pull/17))
- update `rollup-pluginutils` ([#22](https://github.com/rollup/@rollup/plugin-strip/pull/22))

## 1.2.1

- Update dependencies

## 1.2.0

- Use `this.parse` instead of `acorn.parse`
- Make code removal more conservative ([#9](https://github.com/rollup/@rollup/plugin-strip/pull/9))

## 1.1.1

- Return a `name`

## 1.1.0

- Remove methods of `this` and `super` ([#3](https://github.com/rollup/@rollup/plugin-strip/issues/3))

## 1.0.3

- Fix build

## 1.0.2

- Default to adding sourcemap locations

## 1.0.1

- Skip removed call expressions from further AST traversal

## 1.0.0

- Initial release
