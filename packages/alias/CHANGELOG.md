# @rollup/plugin-alias ChangeLog

## v5.1.1

_2024-09-22_

### Bugfixes

- fix: remove unused slash dependency (#1763)

## v5.1.0

_2023-11-25_

### Features

- feat: add warning to avoid unintended duplicate modules (#1634)

## v5.0.1

_2023-10-05_

### Bugfixes

- fix: ensure rollup 4 compatibility [#1595](https://github.com/rollup/plugins/pull/1595)

## v5.0.0

_2023-04-04_

### Breaking Changes

- feat: resolve entry id [#1402](https://github.com/rollup/plugins/pull/1402)

## v4.0.4

_2023-04-04_

### Updates

- docs: fix README esm error [#1451](https://github.com/rollup/plugins/pull/1451)

## v4.0.3

_2023-01-20_

### Bugfixes

- fix: types should come first in exports [#1403](https://github.com/rollup/plugins/pull/1403)

## v4.0.2

_2022-10-21_

### Updates

- chore: update rollup dependencies ([3038271](https://github.com/rollup/plugins/commit/303827191ede6b2e4eade96c6968ed16a587683f))

## v4.0.1

_Skipped for repo rebase_

## v4.0.0

_2022-10-07_

### Breaking Changes

- fix: prepare for Rollup 3, handle latest node-resolve [#1269](https://github.com/rollup/plugins/pull/1269)

## v3.1.9

_2021-12-31_

### Updates

- refactor: avoid resolving customResolver every time handling resolveId (#1024)

## v3.1.8

_2021-10-19_

### Bugfixes

- fix: pass on isEntry flag and custom options (#1017)

## v3.1.7

_2021-10-19_

### Bugfixes

- fix: revert #1000 for hooks bug (#1022)

## v3.1.6

_2021-10-19_

### Updates

- refactor: avoid resolving customResolver every time handling resolveId (#1000)

## v3.1.5

_2021-07-29_

### Bugfixes

- fix: paths for aliases across multiple Windows drives (#896)

## v3.1.4

_2021-07-16_

### Updates

- docs: add helpful notes (#612)

## v3.1.3

_2021-07-15_

### Updates

- docs: fix link to resolveId hook (#881)

## v3.1.2

_2021-01-29_

### Updates

- chore: upgrade TypeScript (#708)
- chore: add missing readonly to internal function (#680)
- chore: fix TS error in function call (d04778c)
- chore: update dependencies (b3b8efd)

## v3.1.1

_2020-06-05_

### Bugfixes

- fix: properly initialize custom resolvers (#426)

## v3.1.0

_2020-04-12_

### Features

- feat: Move to Typescript (#228)

## v3.0.1

_2020-02-01_

### Updates

- docs: Fix reference to plugin-node-resolve (#175)
- chore: update dependencies (bcb53d8)
- chore: update dependencies (e36540f)
- chore: fix minor linting issue (a695579)

## 3.0.0

### Breaking Changes

- feat(alias): built-in resolving algorithm is replaced in favor of Rollup's `this.resolve()` (#34)

## 2.2.0

_2019-10-21_

- Support resolving `index.js` files in directories ([#64](https://github.com/rollup/rollup-plugin-alias/pull/64) by @jerriclynsjohn)

## 2.1.0

_2019-10-18_

- Add support for object syntax ([#61](https://github.com/rollup/rollup-plugin-alias/pull/61) by @Andarist)

## 2.0.1

_2019-09-27_

- Update dependencies ([#59](https://github.com/rollup/rollup-plugin-alias/pull/59) by @lukastaegert)
- Make volume letter regexp case independent ([#57](https://github.com/rollup/rollup-plugin-alias/pull/57) by @MarekLacoAXA)

## 2.0.0

_2019-08-22_

- Add RegExp support and strict order of entries ([#53](https://github.com/rollup/rollup-plugin-alias/pull/53) by @thiscantbeserious)

### Breaking Changes

Aliases always need to be provided as an array, see #53

## 1.5.2

- Update dependencies

## 1.5.1

- Update tests for Rollup@1.0 compatibility and tests ([#48](https://github.com/rollup/rollup-plugin-alias/pull/48))

## 1.4.0

- Various Windows fixes ([#22](https://github.com/rollup/rollup-plugin-alias/pull/22))
- Don't try to alias entry file ([#29](https://github.com/rollup/rollup-plugin-alias/pull/29))

## 1.3.0

- Start maintaining a changelog
- Fix `isFilePath` on Windows ([#3](https://github.com/rollup/rollup-plugin-alias/issues/3))
