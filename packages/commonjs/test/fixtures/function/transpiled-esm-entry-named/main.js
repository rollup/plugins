import * as entry from './entry.js';

t.deepEqual(entry, {
  default: {
    named: 'named',
  },
  named: 'named'
});
