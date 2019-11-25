import Client from 'isomorphic-object-with-false';
import HTTPTracker from 'isomorphic-object-with-false/lib/client/http-tracker';

import HTTPTrackerWithSubPath from 'isomorphic-object-with-false/lib/subpath/foo';

import ES6_BROWSER_EMPTY from '\0node-resolve:empty.js';

// do some assert

t.deepEqual(new Client('ws:'), { name: 'websocket-tracker' });
t.deepEqual(new Client('http:'), { name: 'NULL' });
t.is(HTTPTracker, ES6_BROWSER_EMPTY);
t.is(HTTPTrackerWithSubPath, ES6_BROWSER_EMPTY);

// expose
export default 'ok';
