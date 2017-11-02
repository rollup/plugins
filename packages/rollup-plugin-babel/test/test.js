var assert = require( 'assert' );
var path = require( 'path' );
var rollup = require( 'rollup' );
var SourceMapConsumer = require( 'source-map' ).SourceMapConsumer;
var babelPlugin = require( '..' );

// from ./src/constantss
var HELPERS = 'rollupPluginBabelHelpers';

require( 'source-map-support' ).install();

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

const consoleWarn = console.warn;

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

			assert.ok( code.indexOf( 'function _classCallCheck' ) !== -1, generated.code );
		});
	});

	it( 'adds helpers in loose mode', function () {
		return rollup.rollup({
			entry: 'samples/class-loose/main.js',
			plugins: [ babelPlugin() ]
		}).then( function ( bundle ) {
			var generated = bundle.generate();
			var code = generated.code;

			assert.ok( code.indexOf( 'function _inherits' ) !== -1, generated.code );
		});
	});

	it( 'does not add helpers unnecessarily', function () {
		return rollup.rollup({
			entry: 'samples/basic/main.js',
			plugins: [ babelPlugin() ]
		}).then( function ( bundle ) {
			var generated = bundle.generate();
			var code = generated.code;

			assert.ok( code.indexOf( HELPERS ) === -1, generated.code );
		});
	});

	it( 'does not add helpers when externalHelpers option is truthy', function () {
		return rollup.rollup({
			entry: 'samples/class/main.js',
			plugins: [ babelPlugin({externalHelpers: true}) ]
		}).then( function ( bundle ) {
			var generated = bundle.generate();
			var code = generated.code;

			assert.ok( code.indexOf( 'babelHelpers =' ) === -1, generated.code );
			assert.ok( code.indexOf( `${HELPERS}.classCallCheck =` ) === -1, generated.code );
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
			var target = 'log';
			var generated = bundle.generate({ sourceMap: true });
			var smc = new SourceMapConsumer( generated.map );

			var loc = getLocation( generated.code, generated.code.indexOf( target ) );

			var original = smc.originalPositionFor( loc );

			assert.deepEqual( original, {
				source: path.resolve( 'samples/class/main.js' ).split( path.sep ).join( '/' ),
				line: 3,
				column: 10,
				name: target
			});
		});
	});

	it( 'works with proposal-decorators (#18)', function () {
		return rollup.rollup({
			entry: 'samples/proposal-decorators/main.js',
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
				assert.ok( /error transforming/i.test( err.message ), 'Expected an error about external helpers or module transform, got "' + err.message + '"' );
			});
	});

	it( 'allows transform-runtime to be used instead of bundled helpers', function () {
		return rollup.rollup({
			entry: 'samples/runtime-helpers/main.js',
			plugins: [ babelPlugin({ runtimeHelpers: true }) ],
			onwarn: function ( msg ) {
				assert.equal( msg, 'Treating \'@babel/runtime/helpers/classCallCheck\' as external dependency' );
			}
		}).then( function ( bundle ) {
			var cjs = bundle.generate({ format: 'cjs' }).code;
			assert.ok( !~cjs.indexOf( HELPERS ) );
		});
	});

	it( 'allows transform-runtime to be used with custom moduleName', function () {
		return rollup.rollup({
			entry: 'samples/runtime-helpers-custom-name/main.js',
			plugins: [
				babelPlugin({ runtimeHelpers: true })
			],
			onwarn: function ( msg ) {
				assert.equal( msg, 'Treating \'custom-name/helpers/classCallCheck\' as external dependency' );
			}
		}).then( function ( bundle ) {
			var cjs = bundle.generate({ format: 'cjs' }).code;
			assert.ok( !~cjs.indexOf( HELPERS ) );
		});
	});

	it( 'warns about deprecated usage with external-helper plugin', () => {
		let messages = [];
		console.warn = msg => messages.push( msg );

		return rollup.rollup({
			entry: 'samples/external-helpers-deprecated/main.js',
			plugins: [ babelPlugin() ],
		}).then( (bundle) => {
			console.warn = consoleWarn;
			assert.deepEqual( messages, [
				'Using "external-helpers" plugin with rollup-plugin-babel is deprecated, as it now automatically deduplicates your Babel helpers.'
			]);
		});
	});

	it( 'correctly renames helpers (#22)', () => {
		return rollup.rollup({
			entry: 'samples/named-function-helper/main.js',
			plugins: [ babelPlugin() ],
			onwarn: function ( msg ) {
				assert.equal( msg, 'Treating \'babel-runtime/helpers/classCallCheck\' as external dependency' );
			}
		}).then( function ( bundle ) {
			var cjs = bundle.generate({ format: 'cjs' }).code;
			assert.ok( !~cjs.indexOf( 'babelHelpers_get get' ), 'helper was incorrectly renamed' );
		});
	});

	it( 'runs preflight check correctly in absence of class transformer (#23)', () => {
		return rollup.rollup({
			entry: 'samples/no-class-transformer/main.js',
			plugins: [ babelPlugin() ]
		});
	});

	it( 'produces valid code with typeof helper', () => {
		return rollup.rollup({
			entry: 'samples/typeof/main.js',
			plugins: [ babelPlugin() ]
		}).then( bundle => {
			var generated = bundle.generate();
			assert.equal( generated.code.indexOf( 'var typeof' ), -1, generated.code );
		});
	});
});
