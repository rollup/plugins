import './a';
import a from '_./a?commonjs-proxy';

var b = 42;

console.log( a, b );

var input = {

};

export default input;
export { input as __moduleExports };
