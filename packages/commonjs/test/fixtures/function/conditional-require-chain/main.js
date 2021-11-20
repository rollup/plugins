global.false = false;

if (global.false) {
  // eslint-disable-next-line global-require
  require('./dep.js');
}
