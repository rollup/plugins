import fruit from './fruit.csv';

t.deepEqual(fruit, [
  { type: 'apples', count: '7' },
  { type: 'pears', count: '4' },
  { type: 'bananas', count: '5' }
]);
