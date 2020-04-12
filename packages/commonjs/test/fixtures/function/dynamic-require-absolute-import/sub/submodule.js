/* eslint-disable import/no-dynamic-require, global-require */

function takeModule(name) {
  return require(name);
}

exports.moduleDirect = takeModule('module/direct');
exports.moduleNested = takeModule('module/nested/nested');
exports.parentModule = takeModule('parent-module/parent');
