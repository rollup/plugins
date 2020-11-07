import '_./a?commonjs-require';
import '_./b?commonjs-require';
import require$$0 from '_./a?commonjs-proxy';
import b from '_./b?commonjs-proxy';

var a = require$$0();

console.log( a, b );

var input = {

};

export default input;
export { input as __moduleExports };
