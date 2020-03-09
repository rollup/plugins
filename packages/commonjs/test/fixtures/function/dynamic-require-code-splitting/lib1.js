/* eslint-disable import/no-dynamic-require, global-require */

let message;

for (const index of [1, 2]) {
  try {
    message = require(`./target${index}.js`);
  } catch (err) {
    ({ message } = err);
  }
  t.is(message, '1');
}
