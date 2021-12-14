/* eslint-disable global-require */
// noinspection UnnecessaryLocalVariableJS

// A hack used in many old libraries, saying "workaround to exclude package from browserify list."
// Will bypass rollup-commonjs finding out that this is a require that should not go through the plugin, and will do an infinite search.
const _require = require;
const buffer = _require('buffer');

t.is(buffer, require('buffer'));
