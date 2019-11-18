import {deepEqual} from 'assert';
var err;
try {
  deepEqual({foo: {bar: ['baz']}}, {foo: {bar: ['bat']}}, 'something');
} catch (e) {
  err = e;
}
if (err && err.name === 'AssertionError') {
  done();
} else {
  done(err || new Error('not right'));
}
