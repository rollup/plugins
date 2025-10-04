import { augmentThis, y } from './foo';

const obj = {};
augmentThis.call(obj);
t.is(obj.x, 'x');

t.is(y, 'y');


// Top level `this` will be replaced by the context option
const window = {};
t.is(this, window);
t.is(this.y, undefined);
