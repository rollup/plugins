const tsModule = require('./test.ts');

exports.getCode = tsModule.getCode;
exports.getFiles = tsModule.getFiles;
exports.getImports = tsModule.getImports;
exports.getResolvedModules = tsModule.getResolvedModules;
exports.onwarn = tsModule.onwarn;
exports.testBundle = tsModule.testBundle;
exports.evaluateBundle = tsModule.evaluateBundle;