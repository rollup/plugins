import { __module as input } from "\u0000fixtures/form/no-toplevel-return/input.js?commonjs-module"

var foo = function () {
	return;
};

var bar = () => {
	return;
};

function baz () {
	return;
}

input.exports = 42;

export { exports as __moduleExports } from "\u0000fixtures/form/no-toplevel-return/input.js?commonjs-module"
export default input.exports;
