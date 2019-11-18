import { endianness } from 'os';

const ourE = endianness();
if (endianness() === _osEndianness) {
  done();
} else {
  done(new Error(`wrong endianness, expected ${_osEndianness} but got ${ourE}`));
}
