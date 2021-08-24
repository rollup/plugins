import * as commonjsHelpers from "_commonjsHelpers.js";
import "\u0000React?commonjs-require";
import require$$0 from "\u0000React?commonjs-proxy";

const React = require$$0;

interface ButtonProps {
  children: React.Children;
  className: String;
}

var input = function Button(props: ButtonProps) {
  return <button {...props} />;
}

export default input;
export { input as __moduleExports };
