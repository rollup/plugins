import { inherits } from 'util';

import { Transform } from './transform';

inherits(PassThrough, Transform);
export default PassThrough;
export function PassThrough(options) {
  if (!(this instanceof PassThrough)) return new PassThrough(options);

  Transform.call(this, options);
}

PassThrough.prototype._transform = function(chunk, encoding, cb) {
  cb(null, chunk);
};
