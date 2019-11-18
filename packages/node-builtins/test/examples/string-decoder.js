import {StringDecoder} from 'string_decoder';

var text = Buffer.from('\uD835\uDC00\uD83D\uDCA9\uD835\uDC01');

var decoder = new StringDecoder();
var ref = [ '', '', '', '𝐀', '', '', '', '💩', '', '', '', '𝐁' ];
var len = text.length;
var i = -1;
var bad = 0;
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
