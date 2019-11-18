import {Transform} from 'stream';

var total = 0;
var ended = false;
var t = new Transform({
  objectMode: true,
  transform: function (chunk, _, next) {
    total++;
    next();
  },
  flush: function (end) {
    if (total !== 3) {
      done(new Error('wrong number'));
      end();
      return;
    }
    ended = true;
    end();
  }
});
t.on('finish', function () {
  if (!ended) {
    done(new Error('did not end'));
    return;
  }
  done();
})
t.write('foo');
t.write('bar');
t.end('baz');
