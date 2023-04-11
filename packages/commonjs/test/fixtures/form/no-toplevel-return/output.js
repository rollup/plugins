import * as commonjsHelpers from "_commonjsHelpers.js";

var foo = function () {
	return;
};

var bar = () => {
	return;
};

function baz () {
	return;
}

var input = 42;

export default /*@__PURE__*/commonjsHelpers.getDefaultExportFromCjs(input);
export { input as __moduleExports };
