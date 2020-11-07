import Client from 'isomorphic-object-with-false';
import HTTPTracker from 'isomorphic-object-with-false/lib/client/http-tracker';

import HTTPTrackerWithSubPath from 'isomorphic-object-with-false/lib/subpath/foo';

import ES6_BROWSER_EMPTY from '\0node-resolve:empty.js';

// do some assert
const clientWs = new Client('ws:');
const clientHttp = new Client('http:');

t.is(clientWs.name, 'websocket-tracker');
t.is(clientHttp.name, 'NULL');
t.is(HTTPTracker, ES6_BROWSER_EMPTY);
t.deepEqual(HTTPTrackerWithSubPath, { default: {} });

// expose
export default 'ok';
