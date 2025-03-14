# @rollup/plugin-node-resolve ChangeLog

## v16.0.1

_2025-03-11_

### Bugfixes

- fix: add `ignoreSideEffectsForRoot` to exported interface (#1841)

## v16.0.0

_2024-12-15_

### Breaking Changes

- feat!: set development or production condition (#1823)

## v15.3.1

_2024-12-15_

### Updates

- refactor: replace `test` with `includes` (#1787)

## v15.3.0

_2024-09-23_

### Features

- feat: allow preferBuiltins to be a function (#1694)

## v15.2.4

_2024-09-22_

### Updates

- chore: remove is-builtin-module (#1735)

## v15.2.3

_2023-10-08_

### Bugfixes

- fix: modulePaths default is not set [#1534](https://github.com/rollup/plugins/pull/1534)

## v15.2.2

_2023-10-05_

### Bugfixes

- fix: ensure rollup 4 compatibility [#1595](https://github.com/rollup/plugins/pull/1595)

## v15.2.1

_2023-08-22_

### Bugfixes

- fix: Implement package exports / imports resolution algorithm according to Node documentation [#1549](https://github.com/rollup/plugins/pull/1549)

## v15.2.0

_2023-08-17_

### Features

- feat: pass original importee to secondary resolve [#1557](https://github.com/rollup/plugins/pull/1557)

## v15.1.0

_2023-05-30_

### Features

- feat: Resolve js/jsx/mjs/cjs imports from TypeScript files [#1498](https://github.com/rollup/plugins/pull/1498)

## v15.0.2

_2023-04-04_

### Bugfixes

- fix: bump is-builtin-module version, imports with a trailing slash [#1424](https://github.com/rollup/plugins/pull/1424)

## v15.0.1

_2022-10-21_

### Updates

- chore: update rollup dependencies ([3038271](https://github.com/rollup/plugins/commit/303827191ede6b2e4eade96c6968ed16a587683f))

## v15.0.0

_2022-10-10_

### Breaking Changes

- fix: prepare for Rollup 3 [#1288](https://github.com/rollup/plugins/pull/1288)

## v14.1.0

_2022-09-12_

### Features

- feat: add new option, modulePaths (#1104)

## v14.0.1

_2022-09-08_

### Bugfixes

- fix: handle circular commonjs (#1259)

## v14.0.0

_2022-09-06_

### Breaking Changes

- fix: preserve moduleSideEffects when re-resolving files (#1245)

## v13.3.0

_2022-05-02_

### Features

- feat: support `node:` protocol (#1124)

## v13.2.2

_2022-05-02_

### Bugfixes

- fix: Respect if other plugins resolve the resolution to a different id (#1181)
- fix: Revert respect if other plugins resolve the resolution to a different id (ae59ceb)
- fix: Respect if other plugins resolve the resolution to a different id (f8d4c44)

## v13.2.1

_2022-04-15_

### Bugfixes

- fix: update side effects logic to be deep when glob doesn’t contain `/` (#1148)

## v13.2.0

_2022-04-11_

### Features

- feat: Add the ability to pass a function into resolveOnly (#1152)

## v13.1.3

_2022-01-05_

### Bugfixes

- fix: use correct version when published (#1063)

## v13.1.2

_2021-12-31_

### Bugfixes

- fix: forward meta-information from other plugins (#1062)

## v13.1.1

_2021-12-13_

### Updates

- test: add tests for mixing custom `exportConditions` with `browser: true` (#1043)

## v13.1.0

_2021-12-13_

### Features

- feat: expose plugin version (#1050)

## v13.0.6

_2021-10-19_

### Bugfixes

- fix: pass on isEntry flag (#1016)

## v13.0.5

_2021-09-21_

### Updates

- docs: fix readme heading depth (#999)

## v13.0.4

_2021-07-24_

### Bugfixes

- fix: Fix bug where JS import was converted to a TS import, resulting in an error when using export maps (#921)

## v13.0.3

_2021-07-24_

### Bugfixes

- fix: handle browser-mapped paths correctly in nested contexts (#920)

## v13.0.2

_2021-07-15_

### Bugfixes

- fix: handle "package.json" being in path (#927)

## v13.0.1

_2021-07-15_

### Updates

- docs: Document how to get Node.js exports resolution (#884)

## v13.0.0

_2021-05-04_

### Breaking Changes

- fix!: mark module as external if resolved module is external (#799)

### Features

- feat: Follow up to #843, refining exports and browser field interaction (#866)

## v12.0.0

_2021-05-04_

### Breaking Changes

- fix!: mark module as external if resolved module is external (#799)

### Features

- feat: Follow up to #843, refining exports and browser field interaction (#866)

## v11.2.1

_2021-03-26_

### Bugfixes

- fix: fs.exists is incorrectly promisified (#835)

## v11.2.0

_2021-02-14_

### Features

- feat: add `ignoreSideEffectsForRoot` option (#694)

### Updates

- chore: mark `url` as an external and throw on warning (#783)
- docs: clearer "Resolving Built-Ins" doc (#782)

## v11.1.1

_2021-01-29_

### Bugfixes

- fix: only log last resolve error (#750)

### Updates

- docs: add clarification on the order of package entrypoints (#768)

## v11.1.0

_2021-01-15_

### Features

- feat: support pkg imports and export array (#693)

## v11.0.1

_2020-12-14_

### Bugfixes

- fix: export map specificity (#675)
- fix: add missing type import (#668)

### Updates

- docs: corrected word "yse" to "use" (#723)

## v11.0.0

_2020-11-30_

### Breaking Changes

- refactor!: simplify builtins and remove `customResolveOptions` (#656)
- feat!: Mark built-ins as external (#627)
- feat!: support package entry points (#540)

### Bugfixes

- fix: refactor handling builtins, do not log warning if no local version (#637)

### Updates

- docs: fix import statements in examples in README.md (#646)

## v10.0.0

_2020-10-27_

### Breaking Changes

- fix!: resolve hash in path (#588)

### Bugfixes

- fix: do not ignore exceptions (#564)

## v9.0.0

_2020-08-13_

### Breaking Changes

- chore: update dependencies (e632469)

### Updates

- refactor: remove deep-freeze from dependencies (#529)
- chore: clean up changelog (84dfddb)

## v8.4.0

_2020-07-12_

### Features

- feat: preserve search params and hashes (#487)
- feat: support .js imports in TypeScript (#480)

### Updates

- docs: fix named export use in readme (#456)
- docs: correct mainFields valid values (#469)

## v8.1.0

_2020-06-22_

### Features

- feat: add native node es modules support (#413)

## v8.0.1

_2020-06-05_

### Bugfixes

- fix: handle nested entry modules with the resolveOnly option (#430)

## v8.0.0

_2020-05-20_

### Breaking Changes

- feat: Add default export (#361)
- feat: export defaults (#301)

### Bugfixes

- fix: resolve local files if `resolveOption` is set (#337)

### Updates

- docs: correct misspelling (#343)

## v7.1.3

_2020-04-12_

### Bugfixes

- fix: resolve symlinked entry point properly (#291)

## v7.1.2

_2020-04-12_

### Updates

- docs: fix url (#289)

## v7.1.1

_2020-02-03_

### Bugfixes

- fix: main fields regression (#196)

## v7.1.0

_2020-02-01_

### Updates

- refactor: clean codebase and fix external warnings (#155)

## v7.0.0

_2020-01-07_

### Breaking Changes

- feat: dedupe by package name (#99)

## v6.1.0

_2020-01-04_

### Bugfixes

- fix: allow deduplicating custom module dirs (#101)

### Features

- feat: add rootDir option (#98)

### Updates

- docs: improve doc related to mainFields (#138)

## 6.0.0

_2019-11-25_

- **Breaking:** Minimum compatible Rollup version is 1.20.0
- **Breaking:** Minimum supported Node version is 8.0.0
- Published as @rollup/plugin-node-resolve

## 5.2.1 (unreleased)

- add missing MIT license file ([#233](https://github.com/rollup/rollup-plugin-node-resolve/pull/233) by @kenjiO)
- Fix incorrect example of config ([#239](https://github.com/rollup/rollup-plugin-node-resolve/pull/240) by @myshov)
- Fix typo in readme ([#240](https://github.com/rollup/rollup-plugin-node-resolve/pull/240) by @LinusU)

## 5.2.0 (2019-06-29)

- dedupe accepts a function ([#225](https://github.com/rollup/rollup-plugin-node-resolve/pull/225) by @manucorporat)

## 5.1.1 (2019-06-29)

- Move Rollup version check to buildStart hook to avoid issues ([#232](https://github.com/rollup/rollup-plugin-node-resolve/pull/232) by @lukastaegert)

## 5.1.0 (2019-06-22)

- Fix path fragment inputs ([#229](https://github.com/rollup/rollup-plugin-node-resolve/pull/229) by @bterlson)

## 5.0.4 (2019-06-22)

- Treat sideEffects array as inclusion list ([#227](https://github.com/rollup/rollup-plugin-node-resolve/pull/227) by @mikeharder)

## 5.0.3 (2019-06-16)

- Make empty.js a virtual module ([#224](https://github.com/rollup/rollup-plugin-node-resolve/pull/224) by @manucorporat)

## 5.0.2 (2019-06-13)

- Support resolve 1.11.1, add built-in test ([#223](https://github.com/rollup/rollup-plugin-node-resolve/pull/223) by @bterlson)

## 5.0.1 (2019-05-31)

- Update to resolve@1.11.0 for better performance ([#220](https://github.com/rollup/rollup-plugin-node-resolve/pull/220) by @keithamus)

## 5.0.0 (2019-05-15)

- Replace bublé with babel, update dependencies ([#216](https://github.com/rollup/rollup-plugin-node-resolve/pull/216) by @mecurc)
- Handle module side-effects ([#219](https://github.com/rollup/rollup-plugin-node-resolve/pull/219) by @lukastaegert)

### Breaking Changes

- Requires at least rollup@1.11.0 to work (v1.12.0 for module side-effects to be respected)
- If used with rollup-plugin-commonjs, it should be at least v10.0.0

## 4.2.4 (2019-05-11)

- Add note on builtins to Readme ([#215](https://github.com/rollup/rollup-plugin-node-resolve/pull/215) by @keithamus)
- Add issue templates ([#217](https://github.com/rollup/rollup-plugin-node-resolve/pull/217) by @mecurc)
- Improve performance by caching `isDir` ([#218](https://github.com/rollup/rollup-plugin-node-resolve/pull/218) by @keithamus)

## 4.2.3 (2019-04-11)

- Fix ordering of jsnext:main when using the jsnext option ([#209](https://github.com/rollup/rollup-plugin-node-resolve/pull/209) by @lukastaegert)

## 4.2.2 (2019-04-10)

- Fix TypeScript typings (rename and export Options interface) ([#206](https://github.com/rollup/rollup-plugin-node-resolve/pull/206) by @Kocal)
- Fix mainfields typing ([#207](https://github.com/rollup/rollup-plugin-node-resolve/pull/207) by @nicolashenry)

## 4.2.1 (2019-04-06)

- Respect setting the deprecated fields "module", "main", and "jsnext" ([#204](https://github.com/rollup/rollup-plugin-node-resolve/pull/204) by @nick-woodward)

## 4.2.0 (2019-04-06)

- Add new mainfields option ([#182](https://github.com/rollup/rollup-plugin-node-resolve/pull/182) by @keithamus)
- Added dedupe option to prevent bundling the same package multiple times ([#201](https://github.com/rollup/rollup-plugin-node-resolve/pull/182) by @sormy)

## 4.1.0 (2019-04-05)

- Add TypeScript typings ([#189](https://github.com/rollup/rollup-plugin-node-resolve/pull/189) by @NotWoods)
- Update dependencies ([#202](https://github.com/rollup/rollup-plugin-node-resolve/pull/202) by @lukastaegert)

## 4.0.1 (2019-02-22)

- Fix issue when external modules are specified in `package.browser` ([#143](https://github.com/rollup/rollup-plugin-node-resolve/pull/143) by @keithamus)
- Fix `package.browser` mapping issue when `false` is specified ([#183](https://github.com/rollup/rollup-plugin-node-resolve/pull/183) by @allex)

## 4.0.0 (2018-12-09)

This release will support rollup@1.0

### Features

- Resolve modules used to define manual chunks ([#185](https://github.com/rollup/rollup-plugin-node-resolve/pull/185) by @mcshaman)
- Update dependencies and plugin hook usage ([#187](https://github.com/rollup/rollup-plugin-node-resolve/pull/187) by @lukastaegert)

## 3.4.0 (2018-09-04)

This release now supports `.mjs` files by default

### Features

- feat: Support .mjs files by default (https://github.com/rollup/rollup-plugin-node-resolve/pull/151, by @leebyron)

## 3.3.0 (2018-03-17)

This release adds the `only` option

### New Features

- feat: add `only` option (#83; @arantes555)

### Docs

- docs: correct description of `jail` option (#120; @GeorgeTaveras1231)

## 3.2.0 (2018-03-07)

This release caches reading/statting of files, to improve speed.

### Performance Improvements

- perf: cache file stats/reads (#126; @keithamus)

## 3.0.4 (unreleased)

- Update lockfile [#137](https://github.com/rollup/rollup-plugin-node-resolve/issues/137)
- Update rollup dependency [#138](https://github.com/rollup/rollup-plugin-node-resolve/issues/138)
- Enable installation from Github [#142](https://github.com/rollup/rollup-plugin-node-resolve/issues/142)

## 3.0.3

- Fix [#130](https://github.com/rollup/rollup-plugin-node-resolve/issues/130) and [#131](https://github.com/rollup/rollup-plugin-node-resolve/issues/131)

## 3.0.2

- Ensure `pkg.browser` is an object if necessary ([#129](https://github.com/rollup/rollup-plugin-node-resolve/pull/129))

## 3.0.1

- Remove `browser-resolve` dependency ([#127](https://github.com/rollup/rollup-plugin-node-resolve/pull/127))

## 3.0.0

- [BREAKING] Remove `options.skip` ([#90](https://github.com/rollup/rollup-plugin-node-resolve/pull/90))
- Add `modulesOnly` option ([#96](https://github.com/rollup/rollup-plugin-node-resolve/pull/96))

## 2.1.1

- Prevent `jail` from breaking builds on Windows ([#93](https://github.com/rollup/rollup-plugin-node-resolve/issues/93))

## 2.1.0

- Add `jail` option ([#53](https://github.com/rollup/rollup-plugin-node-resolve/pull/53))
- Add `customResolveOptions` option ([#79](https://github.com/rollup/rollup-plugin-node-resolve/pull/79))
- Support symlinked packages ([#82](https://github.com/rollup/rollup-plugin-node-resolve/pull/82))

## 2.0.0

- Add support `module` field in package.json as an official alternative to jsnext

## 1.7.3

- Error messages are more descriptive ([#50](https://github.com/rollup/rollup-plugin-node-resolve/issues/50))

## 1.7.2

- Allow entry point paths beginning with ./

## 1.7.1

- Return a `name`

## 1.7.0

- Allow relative IDs to be external ([#32](https://github.com/rollup/rollup-plugin-node-resolve/pull/32))

## 1.6.0

- Skip IDs containing null character

## 1.5.0

- Prefer built-in options, but allow opting out ([#28](https://github.com/rollup/rollup-plugin-node-resolve/pull/28))

## 1.4.0

- Pass `options.extensions` through to `node-resolve`

## 1.3.0

- `skip: true` skips all packages that don't satisfy the `main` or `jsnext` options ([#16](https://github.com/rollup/rollup-plugin-node-resolve/pull/16))

## 1.2.1

- Support scoped packages in `skip` option ([#15](https://github.com/rollup/rollup-plugin-node-resolve/issues/15))

## 1.2.0

- Support `browser` field ([#8](https://github.com/rollup/rollup-plugin-node-resolve/issues/8))
- Get tests to pass on Windows

## 1.1.0

- Use node-resolve to handle various corner cases

## 1.0.0

- Add ES6 build, use Rollup 0.20.0

## 0.1.0

- First release
