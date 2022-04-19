import * as entry from './proxy';

t.deepEqual(entry, {
  default: {
    named: 'named',
  },
  named: 'named'
});
