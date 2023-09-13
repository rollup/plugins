export function fn({ foo = console.log(), bar } = {}) {
  const { baz = console.log() } = bar;
  console.log(foo, bar, baz);
}
