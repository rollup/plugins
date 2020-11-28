const _default = 'x';
const foo = 'foo';

const input = /*#__PURE__*/ Object.defineProperty(
  {
    default: _default,
    foo
  },
  '__esModule',
  { value: true }
);

export default _default;
export { input as __moduleExports };
export { foo };
