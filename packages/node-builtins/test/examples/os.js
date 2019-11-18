import {endianness} from 'os';
var ourE = endianness();
if (endianness() === _osEndianness) {
  done();
} else {
  done(new Error(`wrong endianness, expected ${_osEndianness} but got ${ourE}`));
}
