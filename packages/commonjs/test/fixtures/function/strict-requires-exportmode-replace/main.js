t.is(global.hasReplaceModuleExportsRun, undefined, 'before require');
t.is(require('./replaceModuleExports.js').foo, 'foo');

t.is(global.hasReplaceModuleExportsRun, true, 'after require');
delete global.hasReplaceModuleExportsRun;
