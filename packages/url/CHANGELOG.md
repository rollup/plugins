# @rollup/plugin-url ChangeLog

## v5.0.1

_2020-06-05_

### Bugfixes

- fix: add name property to plugin (#433)

## v5.0.0

_2020-05-11_

### Breaking Changes

- fix: Don't append path separator on empty dirname (#212)

## v4.0.2

_2020-02-01_

### Updates

- chore: update dependencies (d048a39)

## v4.0.1

_2020-01-07_

### Bugfixes

- fix: windows compatible, tests (#146)

### Updates

- chore: update changelog for v4.0.0 (087be59)

## 4.0.0

_2019-11-25_

- **Breaking:** Minimum compatible Rollup version is 1.20.0
- **Breaking:** Minimum supported Node version is 8.0.0
- Published as @rollup/plugins-url

### Breaking Changes

- Version 4.0.0 requires Rollup v1.20.0 or higher

## 3.0.0

_2019-10-08_

- Drop node 8 support as its maintenance will be closed in [December](https://github.com/nodejs/Release#release-schedule)
- Migrate to MIT License

## 2.2.4

_2019-10-08_

- Fallback to `mkdirp` to keep working on node <= 8

## 2.2.3

_2019-10-08_

- Remove `mkpath` from dependencies ([#24](https://github.com/rollup/rollup-plugin-url/pull/24))
- Update dev dependencies

## 2.2.2

_2019-06-13_

- Dependencies update

## 2.2.1

_2019-04-10_

- Fix `dirname` substitution on Windows ([#21](https://github.com/rollup/rollup-plugin-url/pull/21))

## 2.2.0

_2019-01-29_

- Add `destDir` option ([#19](https://github.com/rollup/rollup-plugin-url/pull/19))
- Update dependencies

## 2.1.0

_2018-12-02_

- Add `fileName` option ([#17](https://github.com/rollup/rollup-plugin-url/pull/17))

## 2.0.1

_2018-10-09_

- Ensure destination folder exists while `generateBundle` hook performs

## 2.0.0

_2018-10-01_

### Breaking Changes

- Version 2.0.0 requires rollup@0.60 and higher – deprecated `onwrite` hook replaced with new `generateBundle` hook, so plugin will not work with earlier versions of Rollup.  
  Use version 1.4 with rollup<0.60

## 1.4.0

_2018-04-17_

- Add support for `output.dir` option
- Update dependencies

## 1.3.0

_2017-09-17_

- Internal update: it builds now with rollup@0.50

## 1.2.0

_2017-06-09_

- Add ability to prevent emitting any files with the `emitFiles=false` option.

## 1.1.0

_2017-04-12_

- Set default limit to 14kb

## 1.0.0

_2017-04-10_

- Migrate to newer Rollup API (#5).
- Minimal `rollup` version is `0.32.4`
- Braking: `write` method was removed

## 0.1.2

_2016-08-30_

- Add public path option (#1)

## 0.1.1

_2016-02-08_

- Drop charset, it's not needed

## 0.1.0

_2016-02-08_

- Initial release
