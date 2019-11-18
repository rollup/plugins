import msg from './messages';
import zstream from './zstream';
import { deflateInit2, deflateEnd, deflateReset, deflate } from './deflate';
import { inflateInit2, inflate, inflateEnd, inflateReset } from './inflate';
// import constants from './constants';

// zlib modes
export var NONE = 0;
export var DEFLATE = 1;
export var INFLATE = 2;
export var GZIP = 3;
export var GUNZIP = 4;
export var DEFLATERAW = 5;
export var INFLATERAW = 6;
export var UNZIP = 7;
export var Z_NO_FLUSH = 0;
const Z_PARTIAL_FLUSH = 1;
const Z_SYNC_FLUSH = 2;
const Z_FULL_FLUSH = 3;
const Z_FINISH = 4;
const Z_BLOCK = 5;
const Z_TREES = 6;

/* Return codes for the compression/decompression functions. Negative values
 * are errors, positive values are used for special but normal events.
 */
const Z_OK = 0;
const Z_STREAM_END = 1;
const Z_NEED_DICT = 2;
const Z_ERRNO = -1;
const Z_STREAM_ERROR = -2;
const Z_DATA_ERROR = -3;
// Z_MEM_ERROR:     -4,
const Z_BUF_ERROR = -5;
// Z_VERSION_ERROR: -6,

/* compression levels */
const Z_NO_COMPRESSION = 0;
const Z_BEST_SPEED = 1;
const Z_BEST_COMPRESSION = 9;
const Z_DEFAULT_COMPRESSION = -1;

const Z_FILTERED = 1;
const Z_HUFFMAN_ONLY = 2;
const Z_RLE = 3;
const Z_FIXED = 4;
const Z_DEFAULT_STRATEGY = 0;

/* Possible values of the data_type field (though see inflate()) */
const Z_BINARY = 0;
const Z_TEXT = 1;
// Z_ASCII:                1, // = Z_TEXT (deprecated)
const Z_UNKNOWN = 2;

/* The deflate compression method */
const Z_DEFLATED = 8;
export function Zlib(mode) {
  if (mode < DEFLATE || mode > UNZIP) throw new TypeError('Bad argument');

  this.mode = mode;
  this.init_done = false;
  this.write_in_progress = false;
  this.pending_close = false;
  this.windowBits = 0;
  this.level = 0;
  this.memLevel = 0;
  this.strategy = 0;
  this.dictionary = null;
}

Zlib.prototype.init = function(windowBits, level, memLevel, strategy, dictionary) {
  this.windowBits = windowBits;
  this.level = level;
  this.memLevel = memLevel;
  this.strategy = strategy;
  // dictionary not supported.

  if (this.mode === GZIP || this.mode === GUNZIP) this.windowBits += 16;

  if (this.mode === UNZIP) this.windowBits += 32;

  if (this.mode === DEFLATERAW || this.mode === INFLATERAW) this.windowBits = -this.windowBits;

  this.strm = new zstream();
  let status;
  switch (this.mode) {
    case DEFLATE:
    case GZIP:
    case DEFLATERAW:
      status = deflateInit2(
        this.strm,
        this.level,
        Z_DEFLATED,
        this.windowBits,
        this.memLevel,
        this.strategy
      );
      break;
    case INFLATE:
    case GUNZIP:
    case INFLATERAW:
    case UNZIP:
      status = inflateInit2(this.strm, this.windowBits);
      break;
    default:
      throw new Error(`Unknown mode ${this.mode}`);
  }

  if (status !== Z_OK) {
    this._error(status);
    return;
  }

  this.write_in_progress = false;
  this.init_done = true;
};

Zlib.prototype.params = function() {
  throw new Error('deflateParams Not supported');
};

Zlib.prototype._writeCheck = function() {
  if (!this.init_done) throw new Error('write before init');

  if (this.mode === NONE) throw new Error('already finalized');

  if (this.write_in_progress) throw new Error('write already in progress');

  if (this.pending_close) throw new Error('close is pending');
};

Zlib.prototype.write = function(flush, input, in_off, in_len, out, out_off, out_len) {
  this._writeCheck();
  this.write_in_progress = true;

  const self = this;
  process.nextTick(() => {
    self.write_in_progress = false;
    const res = self._write(flush, input, in_off, in_len, out, out_off, out_len);
    self.callback(res[0], res[1]);

    if (self.pending_close) self.close();
  });

  return this;
};

// set method for Node buffers, used by pako
function bufferSet(data, offset) {
  for (let i = 0; i < data.length; i++) {
    this[offset + i] = data[i];
  }
}

Zlib.prototype.writeSync = function(flush, input, in_off, in_len, out, out_off, out_len) {
  this._writeCheck();
  return this._write(flush, input, in_off, in_len, out, out_off, out_len);
};

Zlib.prototype._write = function(flush, input, in_off, in_len, out, out_off, out_len) {
  this.write_in_progress = true;

  if (
    flush !== Z_NO_FLUSH &&
    flush !== Z_PARTIAL_FLUSH &&
    flush !== Z_SYNC_FLUSH &&
    flush !== Z_FULL_FLUSH &&
    flush !== Z_FINISH &&
    flush !== Z_BLOCK
  ) {
    throw new Error('Invalid flush value');
  }

  if (input == null) {
    input = new Buffer(0);
    in_len = 0;
    in_off = 0;
  }

  if (out._set) out.set = out._set;
  else out.set = bufferSet;

  const { strm } = this;
  strm.avail_in = in_len;
  strm.input = input;
  strm.next_in = in_off;
  strm.avail_out = out_len;
  strm.output = out;
  strm.next_out = out_off;
  let status;
  switch (this.mode) {
    case DEFLATE:
    case GZIP:
    case DEFLATERAW:
      status = deflate(strm, flush);
      break;
    case UNZIP:
    case INFLATE:
    case GUNZIP:
    case INFLATERAW:
      status = inflate(strm, flush);
      break;
    default:
      throw new Error(`Unknown mode ${this.mode}`);
  }

  if (status !== Z_STREAM_END && status !== Z_OK) {
    this._error(status);
  }

  this.write_in_progress = false;
  return [strm.avail_in, strm.avail_out];
};

Zlib.prototype.close = function() {
  if (this.write_in_progress) {
    this.pending_close = true;
    return;
  }

  this.pending_close = false;

  if (this.mode === DEFLATE || this.mode === GZIP || this.mode === DEFLATERAW) {
    deflateEnd(this.strm);
  } else {
    inflateEnd(this.strm);
  }

  this.mode = NONE;
};
let status;
Zlib.prototype.reset = function() {
  switch (this.mode) {
    case DEFLATE:
    case DEFLATERAW:
      status = deflateReset(this.strm);
      break;
    case INFLATE:
    case INFLATERAW:
      status = inflateReset(this.strm);
      break;
  }

  if (status !== Z_OK) {
    this._error(status);
  }
};

Zlib.prototype._error = function(status) {
  this.onerror(`${msg[status]}: ${this.strm.msg}`, status);

  this.write_in_progress = false;
  if (this.pending_close) this.close();
};
