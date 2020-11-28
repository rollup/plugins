const foo = 'bar';
const bar = 'foo';

const input = /*#__PURE__*/ Object.defineProperty(
  {
    foo,
    bar
  },
  '__esModule',
  { value: true }
);

export default input;
export { input as __moduleExports };
export { foo };
export { bar };
