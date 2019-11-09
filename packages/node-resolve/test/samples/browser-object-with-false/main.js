import Client from 'isomorphic-object-with-false';
import HTTPTracker from 'isomorphic-object-with-false/lib/client/http-tracker';
import ES6_BROWSER_EMPTY from '\0node-resolve:empty.js';
import HTTPTrackerWithSubPath from 'isomorphic-object-with-false/lib/subpath/foo';

// do some assert

assert.deepEqual(new Client('ws:'), { name: 'websocket-tracker' })
assert.deepEqual(new Client('http:'), { name: 'NULL' })
assert.equal(HTTPTracker, ES6_BROWSER_EMPTY);
assert.equal(HTTPTrackerWithSubPath, ES6_BROWSER_EMPTY);


// expose
export default "ok"
