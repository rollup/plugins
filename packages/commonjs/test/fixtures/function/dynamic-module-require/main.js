/* eslint-disable import/no-dynamic-require, global-require */

let message;

function takeModule(withName) {
  return module.require(`./${withName}`);
}

try {
  const submodule = takeModule('submodule');
  message = submodule();
} catch (err) {
  ({ message } = err);
}

t.is(message, 'Hello there');
