var assert = require( 'assert' );
var path = require( 'path' );
var rollup = require( 'rollup' );
var SourceMapConsumer = require( 'source-map' ).SourceMapConsumer;
var babelPlugin = require( '..' );

// from ./src/constants
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

	async function bundle(input, babelOptions = {}, generateOptions = {}, rollupOptions = {}) {
		const bundle = await rollup.rollup(Object.assign({
			input,
			plugins: [ babelPlugin(babelOptions) ],
		}, rollupOptions));

		return await bundle.generate(Object.assign({ format: 'cjs' }, generateOptions));
	}

	it( 'runs code through babel', async () => {
		const { code } = await bundle('samples/basic/main.js');
		assert.ok( code.indexOf( 'const' ) === -1, code );
	});

	it( 'adds helpers', async () => {
		const { code } = await bundle('samples/class/main.js');
		assert.ok( code.indexOf( 'function _classCallCheck' ) !== -1, code );
	});

	it( 'adds helpers in loose mode', async () => {
		const { code } = await bundle('samples/class-loose/main.js');
		assert.ok( code.indexOf( 'function _inherits' ) !== -1, code );
	});

	it( 'does not add helpers unnecessarily', async () => {
		const { code } = await bundle('samples/basic/main.js');
		assert.ok( code.indexOf( HELPERS ) === -1, code );
	});

	it( 'does not add helpers when externalHelpers option is truthy', async () => {
		const { code } = await bundle('samples/class/main.js');
		assert.ok( code.indexOf( 'babelHelpers =' ) === -1, code );
		assert.ok( code.indexOf( `${HELPERS}.classCallCheck =` ) === -1, code );
	});

	it( 'does not babelify excluded code', async () => {
		const { code } = await bundle('samples/exclusions/main.js', { exclude: '**/foo.js' });
		assert.ok( code.indexOf( '${foo()}' ) === -1, code );
		assert.ok( code.indexOf( '=> 42' ) !== -1, code );
	});

	it( 'generates sourcemap by default', async () => {
		const { code, map } = await bundle('samples/class/main.js', {}, { sourceMap: true });
		const target = 'log';
		const smc = new SourceMapConsumer( map );
    const loc = getLocation( code, code.indexOf( target ) );
		const original = smc.originalPositionFor( loc );

		assert.deepEqual( original, {
			source: path.resolve( 'samples/class/main.js' ).split( path.sep ).join( '/' ),
			line: 3,
			column: 10,
			name: target
		});
	});

	it( 'works with proposal-decorators (#18)', () => {
		return rollup.rollup({
			input: 'samples/proposal-decorators/main.js',
			plugins: [ babelPlugin() ]
		});
	});

	it( 'checks config per-file', () => {
		return rollup.rollup({
			input: 'samples/checks/main.js',
			plugins: [ babelPlugin() ]
		})
			.then( () => {
				assert.ok( false, 'promise should not fulfil' );
			})
			.catch( ( err ) => {
				assert.ok( /module transformer/i.test( err.message ), 'Expected an error about external helpers or module transform, got "' + err.message + '"' );
			});
	});

	it( 'allows transform-runtime to be used instead of bundled helpers', async () => {
		let warnCalled = false;
		const { code } = await bundle(
			'samples/runtime-helpers/main.js',
			{ runtimeHelpers: true },
			{},
			{
				onwarn: function ( warning ) {
					assert.equal( warning.code, 'UNRESOLVED_IMPORT' );
					assert.equal( warning.source, '@babel/runtime/helpers/classCallCheck' );
					warnCalled = true;
				}
			}
		);
		assert.ok( warnCalled, 'onwarn was never triggered about unresolved imports' );
		assert.ok( !~code.indexOf( HELPERS ) );
	});

	it( 'allows transform-runtime to be used with custom moduleName', async () => {
		let warnCalled = false;
		const { code } = await bundle(
			'samples/runtime-helpers-custom-name/main.js',
			{ runtimeHelpers: true },
			{},
			{
				onwarn: function ( warning ) {
					assert.equal( warning.code, 'UNRESOLVED_IMPORT' );
					assert.equal( warning.source, 'custom-name/helpers/classCallCheck' );
					warnCalled = true;
				}
			}
		);
		assert.ok( warnCalled, 'onwarn was never triggered about unresolved imports' );
		assert.ok( !~code.indexOf( HELPERS ) );
	});

	it( 'warns about deprecated usage with external-helper plugin', async () => {
		const messages = [];
		console.warn = msg => messages.push( msg );
		const { code } = await bundle('samples/external-helpers-deprecated/main.js');
		console.warn = consoleWarn;

		assert.deepEqual( messages, [
			'Using "external-helpers" plugin with rollup-plugin-babel is deprecated, as it now automatically deduplicates your Babel helpers.'
		]);
	});

	it( 'correctly renames helpers (#22)', async () => {
		const { code } = await bundle('samples/named-function-helper/main.js');
		assert.ok( !~code.indexOf( 'babelHelpers_get get' ), 'helper was incorrectly renamed' );
	});

	it( 'runs preflight check correctly in absence of class transformer (#23)', () => {
		return rollup.rollup({
			input: 'samples/no-class-transformer/main.js',
			plugins: [ babelPlugin() ]
		});
	});

	it( 'produces valid code with typeof helper', async () => {
		const { code } = await bundle('samples/typeof/main.js');
		assert.equal( code.indexOf( 'var typeof' ), -1, code );
	});
});
