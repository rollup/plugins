var assert = require( 'assert' );
var path = require( 'path' );
var rollup = require( 'rollup' );
var SourceMapConsumer = require( 'source-map' ).SourceMapConsumer;
var babelPlugin = require( '..' );

process.chdir( __dirname );

function getLocation ( source, charIndex ) {
	var lines = source.split( '\n' );
	var len = lines.length;

	var lineStart = 0;
	var i;

	for ( i = 0; i < len; i += 1 ) {
		var line = lines[i];
		var lineEnd =  lineStart + line.length + 1; // +1 for newline

		if ( lineEnd > charIndex ) {
			return { line: i + 1, column: charIndex - lineStart };
		}

		lineStart = lineEnd;
	}

	throw new Error( 'Could not determine location of character' );
}


describe( 'rollup-plugin-babel', function () {
	this.timeout( 15000 );

	it( 'runs code through babel', function () {
		return rollup.rollup({
			entry: 'samples/basic/main.js',
			plugins: [ babelPlugin() ]
		}).then( function ( bundle ) {
			var generated = bundle.generate();

			var code = generated.code;

			assert.ok( code.indexOf( 'const' ) === -1, code );
		});
	});

	it( 'adds helpers', function () {
		return rollup.rollup({
			entry: 'samples/class/main.js',
			plugins: [ babelPlugin() ]
		}).then( function ( bundle ) {
			var generated = bundle.generate();
			var code = generated.code;

			assert.ok( code.indexOf( 'function babelHelpers_classCallCheck' ) !== -1, generated.code );
			assert.ok( code.indexOf( 'var _createClass =' ) === -1, generated.code );
		});
	});

	it( 'does not add helpers unnecessarily', function () {
		return rollup.rollup({
			entry: 'samples/basic/main.js',
			plugins: [ babelPlugin() ]
		}).then( function ( bundle ) {
			var generated = bundle.generate();
			var code = generated.code;

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
			var generated = bundle.generate();
			var code = generated.code;

			assert.ok( code.indexOf( '${foo()}' ) === -1, generated.code );
			assert.ok( code.indexOf( '=> 42' ) !== -1, generated.code );
		});
	});

	it( 'generates sourcemap by default', function () {
		return rollup.rollup({
			entry: 'samples/class/main.js',
			plugins: [ babelPlugin() ]
		}).then( function ( bundle ) {
			var generated = bundle.generate({ sourceMap: true });
			var smc = new SourceMapConsumer( generated.map );

			var loc = getLocation( generated.code, generated.code.indexOf( 'log' ) );
			var original = smc.originalPositionFor( loc );

			assert.deepEqual( original, {
				source: path.resolve( 'samples/class/main.js' ).split( path.sep ).join( '/' ),
				line: 3,
				column: 10,
				name: null
			});
		});
	});

	it( 'works with transform-decorators-legacy (#18)', function () {
		return rollup.rollup({
			entry: 'samples/transform-decorators-legacy/main.js',
			plugins: [ babelPlugin() ]
		});
	});

	it( 'checks config per-file', function () {
		return rollup.rollup({
			entry: 'samples/checks/main.js',
			plugins: [ babelPlugin() ]
		})
			.then( function () {
				assert.ok( false, 'promise should not fulfil' );
			})
			.catch( function ( err ) {
				assert.ok( /es2015-rollup/.test( err.message ), 'Expected an error about external helpers or module transform, got "' + err.message + '"' );
			});
	});

	it( 'allows transform-runtime to be used instead of bundled helpers', function () {
		return rollup.rollup({
			entry: 'samples/runtime-helpers/main.js',
			plugins: [ babelPlugin({ runtimeHelpers: true }) ],
			onwarn: function ( msg ) {
				assert.equal( msg, `Treating 'babel-runtime/helpers/classCallCheck' as external dependency` );
			}
		}).then( function ( bundle ) {
			var cjs = bundle.generate({ format: 'cjs' }).code;
			assert.ok( !~cjs.indexOf( 'babelHelpers' ) );
		});
	});

	it( 'correctly renames helpers (#22)', () => {
		return rollup.rollup({
			entry: 'samples/named-function-helper/main.js',
			plugins: [ babelPlugin() ],
			onwarn: function ( msg ) {
				assert.equal( msg, `Treating 'babel-runtime/helpers/classCallCheck' as external dependency` );
			}
		}).then( function ( bundle ) {
			var cjs = bundle.generate({ format: 'cjs' }).code;
			assert.ok( !~cjs.indexOf( 'babelHelpers_get get' ), 'helper was incorrectly renamed' );
		});
	});
});
