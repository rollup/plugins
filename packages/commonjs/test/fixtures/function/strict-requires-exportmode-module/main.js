t.is(global.hasAssignModuleExportsRun, undefined, 'before require');
t.is(require('./assignModuleExports.js').foo, 'foo');

t.is(global.hasAssignModuleExportsRun, true, 'after require');
delete global.hasAssignModuleExportsRun;

t.is(global.hasAssignModuleAndExportsRun, undefined, 'before require');
t.is(require('./assignModuleAndExports.js').foo, 'foo');

t.is(global.hasAssignModuleAndExportsRun, true, 'after require');
delete global.hasAssignModuleAndExportsRun;

t.is(global.hasWrappedModuleExportsRun, undefined, 'before require');
t.is(require('./wrappedModuleExports.js').foo, 'foo');

t.is(global.hasWrappedModuleExportsRun, true, 'after require');
delete global.hasWrappedModuleExportsRun;
