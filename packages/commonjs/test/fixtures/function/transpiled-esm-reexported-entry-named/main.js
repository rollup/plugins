import * as entry from './proxy';

// Note: There ideally shouldn't be a default generated property.
//
// This should however be harmless.
t.deepEqual(entry, {
  default: {
    named: 'named',
  },
  named: 'named'
});
