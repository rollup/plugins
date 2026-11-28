import fruit from './fruit.csv' with { type: 'csv' };

expect(fruit).toEqual([
  { type: 'apples', count: '7' },
  { type: 'pears', count: '4' },
  { type: 'bananas', count: '5' }
]);
