import fruit from './fruit.tsv';

expect(fruit).toEqual([
  { type: 'apples', count: '7' },
  { type: 'pears', count: '4' },
  { type: 'bananas', count: '5' }
]);
