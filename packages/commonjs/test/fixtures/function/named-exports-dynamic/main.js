import { named } from './x.js';

t.is(named, undefined);

window.addExport('named', 'foo');

t.is(named, 'foo');
