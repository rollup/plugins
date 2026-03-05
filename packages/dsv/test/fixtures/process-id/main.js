import lower from './lower.csv';
import upper from './upper.csv';

expect(lower).toEqual([
  { type: 'apples', count: 7 },
  { type: 'pears', count: 4 },
  { type: 'bananas', count: 5 }
]);

expect(upper).toEqual([
  { type: 'APPLES', count: 7 },
  { type: 'PEARS', count: 4 },
  { type: 'BANANAS', count: 5 }
]);
