# rollup-plugin-babel changelog

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
