const { augmentThis, classThis, y } = require('./foo');

const obj = {};
augmentThis.call(obj);

t.is(obj.x, 'x');
t.is(this.y, undefined);
t.is(y, 'y');

const instance = new classThis();

t.is(instance.yy,'yy');
t.is(instance._instance.yyy,'yyy');
