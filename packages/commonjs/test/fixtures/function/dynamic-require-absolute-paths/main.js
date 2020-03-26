/* eslint-disable import/no-dynamic-require, global-require */

const Path = require('path');
let basePath = process.cwd() + '/fixtures/function/dynamic-require-absolute-paths';

t.is(require(Path.resolve(`${basePath}/submodule.js`)), 'submodule');
