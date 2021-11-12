export default function Foo(...args) {
  this.foo = args;
}

Foo.prototype.update = function () {
  this.foo = 'updated';
};

export const bar = 'bar';
