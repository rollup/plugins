/* eslint-disable import/no-dynamic-require, global-require */

function takeModule(name) {
  return require(name);
}

t.is(takeModule('.'), 'same-directory', '.');
t.is(takeModule('./'), 'same-directory', './');
t.is(takeModule('.//'), 'same-directory', './/');

t.is(takeModule('./sub'), 'sub', './sub');

t.is(takeModule('custom-module'), 'custom-module + sub', 'custom-module');
t.deepEqual(require('./sub/sub'), {
  parent: 'same-directory',
  customModule: 'custom-module + sub'
});
