import './b';
import b from '_./b?commonjs-proxy';

var a = 'a'
  , c = 'c';

console.log( a, b, c );

var input = {

};

export default input;
export { input as __moduleExports };
