import { Transform } from 'stream';

let total = 0;
let ended = false;
const t = new Transform({
  objectMode: true,
  transform(chunk, _, next) {
    total++;
    next();
  },
  flush(end) {
    if (total !== 3) {
      done(new Error('wrong number'));
      end();
      return;
    }
    ended = true;
    end();
  }
});
t.on('finish', () => {
  if (!ended) {
    done(new Error('did not end'));
    return;
  }
  done();
});
t.write('foo');
t.write('bar');
t.end('baz');
