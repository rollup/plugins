import 'foo';
import require$$1 from '_foo?commonjs-proxy';

(function() {
  var foo = require$$1;
  var require$$0 = "FAIL";
  console.log(foo);
})();

var input = {

};

export default input;
export { input as __moduleExports };
