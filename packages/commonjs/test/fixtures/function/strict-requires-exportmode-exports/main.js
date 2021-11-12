t.is(global.hasAssignExportsRun, undefined, 'before require');
t.deepEqual(require('./assignExports.js'), { foo: 'foo', bar: 'bar' });

t.is(global.hasAssignExportsRun, true, 'after require');
delete global.hasAssignExportsRun;

t.is(global.hasCompiledEsmRun, undefined, 'before require');
t.deepEqual(require('./compiledEsm.js'), { foo: 'foo', __esModule: true });

t.is(global.hasCompiledEsmRun, true, 'after require');
delete global.hasCompiledEsmRun;

t.is(global.hasWrappedExportsRun, undefined, 'before require');
t.deepEqual(require('./wrappedExports.js'), { foo: 'foo' });

t.is(global.hasWrappedExportsRun, true, 'after require');
delete global.hasWrappedExportsRun;
