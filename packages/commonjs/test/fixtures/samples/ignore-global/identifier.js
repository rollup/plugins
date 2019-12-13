// require (firstpass)
// eslint-disable-next-line
export var immediate =
  typeof global.setImmediate === 'function' ? global.setImmediate : global.setTimeout;
