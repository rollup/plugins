import {deflateSync, inflateSync} from 'zlib';


var input = new Buffer('hello hello hello');

var deflated = deflateSync(input);

var reinflated = inflateSync(deflated);

if (reinflated.toString() !== 'hello hello hello') {
  done(new Error('expected \'hello hello hello\' but got \'' + reinflated.toString() +'\''));
} else {
  next();
}
function next() {
  var expected = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  var deflated = Buffer.from('eJxLTCQVAADjXBLz', 'base64');
  var reinflated = inflateSync(deflated).toString();
  if (reinflated.toString() !== expected) {
    done(new Error(`expected '${expected}' but got '${reinflated}'`));
  } else {
    done();
  }
}
