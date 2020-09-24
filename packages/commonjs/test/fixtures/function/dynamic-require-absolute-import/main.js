/* eslint-disable import/no-dynamic-require, global-require */

t.deepEqual(require('./sub/submodule'), {
  moduleDirect: 'direct',
  moduleNested: 'nested',
  parentModule: 'parent'
});
