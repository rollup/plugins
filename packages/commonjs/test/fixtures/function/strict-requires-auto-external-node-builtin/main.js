const stream = require('node:stream');
const readable = new stream.Readable({});

module.exports = { Readable: stream.Readable, readable };
