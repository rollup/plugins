import { create } from 'domain';

const d = create();
d.on('error', (err) => {
  if (!err || err.message !== 'a thrown error') {
    done(new Error('wrong message'));
  } else {
    next();
  }
});
d.run(() => {
  throw new Error('a thrown error');
});

function next() {
  const d = create();
  d.on('error', (err) => {
    if (!err || err.message !== 'a thrown error') {
      done(new Error('wrong message'));
    } else {
      done();
    }
  });
  d.bind((err, a, b) => {
    if (!err || err.message !== 'a passed error') {
      done(new Error('wrong message'));
    } else if (a !== 2 || b !== 3) {
      done(new Error('wrong stuff'));
    } else {
      throw new Error('a thrown error');
    }
  })(new Error('a passed error'), 2, 3);
}
