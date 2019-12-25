// require (firstpass)

// "this" will be rewritten with "undefined" by rollup
// eslint-disable-next-line
export var immediate =
  typeof this === 'undefined'
    ? null
    : typeof this.setImmediate === 'function'
    ? this.setImmediate
    : this.setTimeout;
