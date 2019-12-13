import { message } from 'external';

import { named } from './secret-named-exporter.js';

t.is(named, 42);
t.is(message, 'it works');
