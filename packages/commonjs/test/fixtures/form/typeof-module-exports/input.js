var foo = 42;

if ( typeof exports === 'object' && typeof module === 'object' ) {
	module.exports = foo;
} else if ( typeof define === 'function' && define.amd ) {
	define([], function () { return foo; });
} else {
	window.foo = foo;
}
