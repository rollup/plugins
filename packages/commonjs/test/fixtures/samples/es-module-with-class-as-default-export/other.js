export default class Foo {
  constructor(...args) {
    if (args.length !== 2) {
      throw new Error(`new Foo(...) requires exactly 2 arguments, received ${args.length}`);
    }
  }
}
