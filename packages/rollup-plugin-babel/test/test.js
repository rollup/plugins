var assert = require( 'assert' );
var rollup = require( 'rollup' );
var babelPlugin = require( '..' );

process.chdir( __dirname );

describe( 'rollup-plugin-babel', function () {
	this.timeout( 5000 );

	it( 'runs code through babel', function () {
		var start = Date.now();
		return rollup.rollup({
			entry: 'samples/basic/main.js',
			plugins: [ babelPlugin() ]
		}).then( function ( bundle ) {
			start = Date.now();
			const generated = bundle.generate();

			const code = generated.code;

			assert.ok( code.indexOf( 'const' ) === -1, code );
		});
	});

	it( 'adds helpers', function () {
		return rollup.rollup({
			entry: 'samples/class/main.js',
			plugins: [ babelPlugin() ]
		}).then( function ( bundle ) {
			const generated = bundle.generate();
			const code = generated.code;

			assert.ok( code.indexOf( 'babelHelpers.classCallCheck =' ) !== -1, generated.code );
			assert.ok( code.indexOf( 'var _createClass =' ) === -1, generated.code );
		});
	});

	it( 'does not add helpers unnecessarily', function () {
		return rollup.rollup({
			entry: 'samples/basic/main.js',
			plugins: [ babelPlugin() ]
		}).then( function ( bundle ) {
			const generated = bundle.generate();
			const code = generated.code;

			assert.ok( code.indexOf( 'babelHelpers' ) === -1, generated.code );
		});
	});

	it( 'does not babelify excluded code', function () {
		return rollup.rollup({
			entry: 'samples/exclusions/main.js',
			plugins: [
				babelPlugin({ exclude: '**/foo.js' })
			]
		}).then( function ( bundle ) {
			const generated = bundle.generate();
			const code = generated.code;

			assert.ok( code.indexOf( '${foo()}' ) === -1, generated.code );
			assert.ok( code.indexOf( '=> 42' ) !== -1, generated.code );
		});
	});
});
