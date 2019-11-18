# Changelog

3.0.0 / 2019-10-08
=================
* drop node 8 support as it's maintenance will be closed in [December](https://github.com/nodejs/Release#release-schedule)
* migrate to MIT License 

2.2.4 / 2019-10-08
=================
* fallback to `mkdirp` to keep working on node <= 8

2.2.3 / 2019-10-08
=================
* remove `mkpath` from dependencies ([#24](https://github.com/rollup/rollup-plugin-url/pull/24))
* update dev dependencies

2.2.2 / 2019-06-13
=================
* dependencies update

2.2.1 / 2019-04-10
=================
* Fix `dirname` substitution on Windows ([#21](https://github.com/rollup/rollup-plugin-url/pull/21))

2.2.0 / 2019-01-29
=================
* add `destDir` option ([#19](https://github.com/rollup/rollup-plugin-url/pull/19))
* update dependencies

2.1.0 / 2018-12-02
==================
* add `fileName` option ([#17](https://github.com/rollup/rollup-plugin-url/pull/17))

2.0.1 / 2018-10-09
==================
* ensure destination folder exist while `generateBundle` hook performs

2.0.0 / 2018-10-01
==================
* **Breaking:** version 2.0.0 requires rollup@0.60 and higher – deprecated `onwrite` hook replaced with new `generateBundle` hook, so plugin will not work with earlier versions of rollup.  
Use version 1.4 with rollup<0.60

1.4.0 / 2018-04-17
==================
 * add support for `output.dir` option
 * update dependencies

1.3.0 / 2017-09-17
==================
 * internal update: it builds now with rollup@0.50 

1.2.0 / 2017-06-09
==================

 * add ability to prevent emitting any files with the `emitFiles=false` option.

1.1.0 / 2017-04-12
==================

 * set default limit to 14kb

1.0.0 / 2017-04-10
==================

 * Migrate to newer rollup API (#5).
 * Minimal `rollup` version is `0.32.4`
 * Braking: `write` method was removed

0.1.2 / 2016-08-30
==================

  * Add public path option (#1)

0.1.1 / 2016-02-08
==================

  * drop charset, its not needed

0.1.0 / 2016-02-08
==================

  * Initial release
