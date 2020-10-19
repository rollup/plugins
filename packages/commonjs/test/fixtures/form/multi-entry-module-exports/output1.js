import '_./input2.js?commonjs-require';
import t2 from '_./input2.js?commonjs-proxy';

console.log(t2);
var input1 = 1;

export default input1;
export { input1 as __moduleExports };
