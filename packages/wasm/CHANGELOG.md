# @rollup/plugin-wasm ChangeLog

## v6.1.1

_2022-12-17_

### Bugfixes

- fix: rejecting with error on node.js file read [#1346](https://github.com/rollup/plugins/pull/1346)

## v6.1.0

_2022-12-17_

### Features

- feat: add wasm fileName customization [#1372](https://github.com/rollup/plugins/pull/1372)

## v6.0.1

_2022-10-21_

### Updates

- chore: update rollup dependencies ([3038271](https://github.com/rollup/plugins/commit/303827191ede6b2e4eade96c6968ed16a587683f))

## v6.0.0

_2022-10-10_

### Breaking Changes

- fix: prepare for Rollup 3 [#1301](https://github.com/rollup/plugins/pull/1301)

## v5.2.0

_2022-04-29_

### Features

- feat: Add target environment configuration (#1132)

### Updates

- test: reference atob polyfill in browser test (#1179)

## v5.1.2

_2020-12-14_

### Bugfixes

- fix: Remove `eval` calls and enable dummy sourcemap (#685)

## v5.1.1

_2020-10-27_

### Updates

- refact: use helper module instead of banner (#607)

## v5.1.0

_2020-09-09_

### Features

- feat: option to not inline wasm (#543)

### Updates

- chore: update dependencies (8ac8237)

## v5.0.0

_2020-05-20_

### Breaking Changes

- chore!: drop node 8 support (ba32053)

### Features

- feat: Switch to TypeScript & named exports (#363)

## v4.0.0

_2020-05-02_

### Breaking Changes

- fix: work with service workers (#334)

## 3.0.0

_2018-02-17_

### Breaking Changes

- A function is now imported instead of the module.

### Features

- feat: simplify wasm imports (ace7b2a)
