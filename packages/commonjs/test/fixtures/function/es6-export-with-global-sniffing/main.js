// this test makes sure that "submodule" is not wrapped in commonjs
//   helper due to its use of "typeof module", given that "submodule" has es6 exports.
// any attempt to wrap it in a function will just fail as it's invalid syntax.

import getGlobalPollution from './submodule.js';

t.is(getGlobalPollution(), global.pollution);
