t.is(global.hasAssignExportsRun, undefined, 'before require');
t.is(require('./assignExports.js').foo, 'foo');

t.is(global.hasAssignExportsRun, true, 'after require');
delete global.hasAssignExportsRun;

t.is(global.hasReassignModuleExportsRun, undefined, 'before require');
t.is(require('./reassignModuleExports.js').foo, 'foo');

t.is(global.hasReassignModuleExportsRun, true, 'after require');
delete global.hasReassignModuleExportsRun;

t.is(global.hasCompiledEsmRun, undefined, 'before require');
t.is(require('./compiledEsm.js').foo, 'foo');

t.is(global.hasCompiledEsmRun, true, 'after require');
delete global.hasCompiledEsmRun;
