import foo from './foo';
import required from './requiring';

t.is(foo, 'imported');
t.is(required.foo, 'required');

export default Promise.all([import('./bar'), required.barPromise]);
