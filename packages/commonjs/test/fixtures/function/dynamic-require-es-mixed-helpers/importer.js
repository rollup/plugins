t.is(global.hasSubmoduleRun, undefined, 'before require');

// eslint-disable-next-line global-require
export default require('./submodule.js');

t.is(global.hasSubmoduleRun, true, 'after require');
delete global.hasSubmoduleRun;
