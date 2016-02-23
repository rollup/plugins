# rollup-plugin-babel changelog

## 2.4.0

* Add `externalHelpers` option ([#41](https://github.com/rollup/rollup-plugin-babel/pull/41))

## 2.3.9

* Do not rename Babel helpers ([#34](https://github.com/rollup/rollup-plugin-babel/pull/34))

## 2.3.8

* Create new version to (hopefully) solve bizarre CI issue

## 2.3.7

* Be less clever about renaming Babel helpers ([#19](https://github.com/rollup/rollup-plugin-babel/issues/19))

## 2.3.6

* Fix cache misses in preflight check ([#29](https://github.com/rollup/rollup-plugin-babel/pull/29))

## 2.3.5

* Use class transformer local to plugin, not project being built

## 2.3.4

* Ensure class transformer is present for preflight check, and only run check once per directory ([#23](https://github.com/rollup/rollup-plugin-babel/issues/23))

## 2.3.3

* Fix helper renaming ([#22](https://github.com/rollup/rollup-plugin-babel/issues/22))

## 2.3.1-2

* Include correct files in npm package

## 2.3.0

* Allow `transform-runtime` Babel plugin, if combined with `runtimeHelpers: true` option ([#17](https://github.com/rollup/rollup-plugin-babel/issues/17))
* More permissive handling of helpers – only warn if inline helpers are duplicated
* Handle plugins that change export patterns ([#18](https://github.com/rollup/rollup-plugin-babel/issues/18))

## 2.2.0

* Preflight checks are run per-file, to avoid configuration snafus ([#16](https://github.com/rollup/rollup-plugin-babel/issues/16))

## 2.1.0

* Generate sourcemaps by default

## 2.0.1

* Use object-assign ponyfill
* Add travis support
* Fix test

## 2.0.0

* Babel 6 compatible

## 1.0.0

* First release
