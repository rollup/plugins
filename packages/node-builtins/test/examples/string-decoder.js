import { StringDecoder } from 'string_decoder';

const text = Buffer.from('\uD835\uDC00\uD83D\uDCA9\uD835\uDC01');

const decoder = new StringDecoder();
const ref = ['', '', '', '𝐀', '', '', '', '💩', '', '', '', '𝐁'];
const len = text.length;
let i = -1;
let bad = 0;
while (++i < len) {
  if (ref[i] !== decoder.write(text.slice(i, i + 1))) {
    bad++;
  }
}
if (bad) {
  done(new Error('did not work right'));
} else {
  done();
}
