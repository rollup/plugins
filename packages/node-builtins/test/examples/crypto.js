import crypto from 'crypto';

if (Object.keys(crypto).length) {
  done(new Error('should not import crypto'));
} else {
  done();
}
