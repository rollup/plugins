let root;

if (typeof self !== 'undefined') {
  root = self;
} else if (typeof window !== 'undefined') {
  root = window;
} else if (typeof global !== 'undefined') {
  root = global;
} else if (typeof module !== 'undefined') {
  root = module;
} else {
  root = Function('return this')(); // eslint-disable-line no-new-func
}

root.pollution = 'foo';

const getGlobalPollution = () => 'foo';

export default getGlobalPollution;
