import { deflateSync, inflateSync } from 'zlib';

const input = new Buffer('hello hello hello');

const deflated = deflateSync(input);

const reinflated = inflateSync(deflated);

if (reinflated.toString() !== 'hello hello hello') {
  done(new Error(`expected 'hello hello hello' but got '${reinflated.toString()}'`));
} else {
  next();
}
function next() {
  const expected = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  const deflated = Buffer.from('eJxLTCQVAADjXBLz', 'base64');
  const reinflated = inflateSync(deflated).toString();
  if (reinflated.toString() !== expected) {
    done(new Error(`expected '${expected}' but got '${reinflated}'`));
  } else {
    done();
  }
}
