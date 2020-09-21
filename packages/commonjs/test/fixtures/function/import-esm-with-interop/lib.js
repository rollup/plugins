/* eslint-disable import/no-mutable-exports */
let foo = 'foo';
let bar = 'bar';
export { foo as default, bar };

export function update(newFoo, newBar) {
  foo = newFoo;
  bar = newBar;
}
