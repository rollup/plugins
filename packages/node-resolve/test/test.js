const path = require( 'path' );
const assert = require( 'assert' );
const rollup = require( 'rollup' );
const commonjs = require( 'rollup-plugin-commonjs' );
const babel = require( 'rollup-plugin-babel' );
const nodeResolve = require( '..' );
const fs = require( 'fs' );

process.chdir( __dirname );

function expectWarnings (warnings) {
	let warningIndex = 0;
	return warning => {
		if (warningIndex >= warnings.length) {
			throw new Error(`Unexpected warning: "${warning.message}"`);
		} else {
			const expectedWarning = warnings[warningIndex];
			for (const key of Object.keys(expectedWarning)) {
				assert.strictEqual(warning[key], expectedWarning[key]);
			}
		}
		warningIndex++;
	};
}

const expectNoWarnings = expectWarnings([]);

function executeBundle ( bundle ) {
	return bundle.generate({
		format: 'cjs'
	}).then( generated => {
		const fn = new Function ( 'module', 'exports', 'assert', 'require', generated.output[0].code );
		const module = { exports: {} };

		try {
			fn(module, module.exports, assert, require);
		} catch (error) {
			// eslint-disable-next-line no-console
			console.log(generated.output[0].code);
			throw error;
		}

		return module;
	});
}

function getBundleImports ( bundle) {
	return bundle.imports ? Promise.resolve(bundle.imports) : bundle.generate({format: 'esm'})
		.then(generated => generated.output[0].imports);
}

describe( 'rollup-plugin-node-resolve', function () {
	it( 'finds a module with jsnext:main', function () {
		return rollup.rollup({
			input: 'samples/jsnext/main.js',
			onwarn: expectNoWarnings,
			plugins: [
				nodeResolve({ mainFields: ['jsnext:main', 'module', 'main'] })
			]
		}).then( executeBundle ).then( module => {
			assert.equal( module.exports, 'JSNEXT' );
		});
	});

	it( 'DEPRECATED: options.jsnext still works with correct priority', function () {
		return rollup.rollup({
			input: 'samples/jsnext/main.js',
			plugins: [
				nodeResolve({ jsnext: true, main: true })
			]
		}).then( executeBundle ).then( module => {
			assert.equal( module.exports, 'JSNEXT' );
		});
	});

	it( 'DEPRECATED: options.module still works with correct priority', function () {
		return rollup.rollup({
			input: 'samples/module/main.js',
			plugins: [
				nodeResolve({ module: true, main: true, preferBuiltins: false })
			]
		}).then( executeBundle ).then( module => {
			assert.equal( module.exports, 'MODULE' );
		});
	});

	it( 'finds and converts a basic CommonJS module', function () {
		return rollup.rollup({
			input: 'samples/commonjs/main.js',
			onwarn: expectNoWarnings,
			plugins: [
				nodeResolve({ mainFields: ['main'] }),
				commonjs()
			]
		}).then( executeBundle ).then( module => {
			assert.equal( module.exports, 'It works!' );
		});
	});

	it( 'handles a trailing slash', function () {
		return rollup.rollup({
			input: 'samples/trailing-slash/main.js',
			onwarn: expectNoWarnings,
			plugins: [
				nodeResolve({ mainFields: ['main'] }),
				commonjs()
			]
		}).then( executeBundle ).then( module => {
			assert.equal( module.exports, 'It works!' );
		});
	});

	it( 'finds a file inside a package directory', function () {
		return rollup.rollup({
			input: 'samples/granular/main.js',
			onwarn: expectNoWarnings,
			plugins: [
				nodeResolve(),
				babel({
					presets: [
						[
							'@babel/preset-env',
							{
								targets: {
									node: 6
								}
							}
						]
					]
				})
			]
		}).then( executeBundle ).then( module => {
			assert.equal( module.exports, 'FOO' );
		});
	});

	it( 'loads local directories by finding index.js within them', function () {
		return rollup.rollup({
			input: 'samples/local-index/main.js',
			onwarn: expectNoWarnings,
			plugins: [
				nodeResolve()
			]
		}).then( executeBundle ).then( module => {
			assert.equal( module.exports, 42 );
		});
	});

	it( 'loads package directories by finding index.js within them', function () {
		return rollup.rollup({
			input: 'samples/package-index/main.js',
			onwarn: expectNoWarnings,
			plugins: [
				nodeResolve()
			]
		}).then( function ( bundle ) {
			return bundle.generate({
				format: 'cjs'
			});
		}).then( generated => {
			assert.ok( ~generated.output[0].code.indexOf( 'setPrototypeOf' ) );
		});
	});

	it( 'disregards top-level browser field', function () {
		return rollup.rollup({
			input: 'samples/browser/main.js',
			onwarn: expectNoWarnings,
			plugins: [
				nodeResolve()
			]
		}).then( executeBundle ).then( module => {
			assert.equal( module.exports, 'node' );
		});
	});

	it( 'allows use of the top-level browser field', function () {
		return rollup.rollup({
			input: 'samples/browser/main.js',
			onwarn: expectNoWarnings,
			plugins: [
				nodeResolve({
					mainFields: [ 'browser', 'main' ]
				})
			]
		}).then( executeBundle ).then( module => {
			assert.equal( module.exports, 'browser' );
		});
	});

	it( 'disregards object browser field', function () {
		return rollup.rollup({
			input: 'samples/browser-object/main.js',
			onwarn: expectNoWarnings,
			plugins: [
				nodeResolve()
			]
		}).then( executeBundle ).then( module => {
			assert.equal( module.exports.env, 'node' );
			assert.equal( module.exports.dep, 'node-dep' );
			assert.equal( module.exports.test, 42 );
		});
	});

	it( 'allows use of the object browser field', function () {
		return rollup.rollup({
			input: 'samples/browser-object/main.js',
			onwarn: expectNoWarnings,
			plugins: [
				nodeResolve({
					mainFields: [ 'browser', 'main' ]
				})
			]
		}).then( executeBundle ).then( module => {
			assert.equal( module.exports.env, 'browser' );
			assert.equal( module.exports.dep, 'browser-dep' );
			assert.equal( module.exports.test, 43 );
		});
	});

	it( 'allows use of object browser field, resolving `main`', function () {
		return rollup.rollup({
			input: 'samples/browser-object-main/main.js',
			onwarn: expectNoWarnings,
			plugins: [
				nodeResolve({
					mainFields: [ 'browser', 'main' ]
				})
			]
		}).then( executeBundle ).then( module => {
			assert.equal( module.exports.env, 'browser' );
			assert.equal( module.exports.dep, 'browser-dep' );
			assert.equal( module.exports.test, 43 );
		});
	});

	it( 'options.browser = true still works', function () {
		return rollup.rollup({
			input: 'samples/browser-object-main/main.js',
			plugins: [
				nodeResolve({
					browser: true
				})
			]
		}).then( executeBundle ).then( module => {
			assert.equal( module.exports.env, 'browser' );
			assert.equal( module.exports.dep, 'browser-dep' );
			assert.equal( module.exports.test, 43 );
		});
	});

	it( 'allows use of object browser field, resolving implicit `main`', function () {
		return rollup.rollup({
			input: 'samples/browser-object/main-implicit.js',
			onwarn: expectNoWarnings,
			plugins: [
				nodeResolve({
					mainFields: [ 'browser', 'main' ]
				})
			]
		}).then( executeBundle ).then( module => {
			assert.equal( module.exports.env, 'browser' );
		});
	});

	it( 'allows use of object browser field, resolving replaced builtins', function () {
		return rollup.rollup({
			input: 'samples/browser-object-builtin/main.js',
			onwarn: expectNoWarnings,
			plugins: [
				nodeResolve({
					mainFields: [ 'browser', 'main' ]
				})
			]
		}).then( executeBundle ).then( module => {
			assert.equal( module.exports, 'browser-fs' );
		});
	});

	it( 'allows use of object browser field, resolving nested directories', function () {
		return rollup.rollup({
			input: 'samples/browser-object-nested/main.js',
			onwarn: expectNoWarnings,
			plugins: [
				nodeResolve({
					mainFields: [ 'browser', 'main' ]
				})
			]
		}).then( executeBundle ).then( module => {
			assert.equal( module.exports.env, 'browser' );
			assert.equal( module.exports.dep, 'browser-dep' );
			assert.equal( module.exports.test, 43 );
		});
	});

	it( 'allows use of object browser field, resolving `main`', function () {
		return rollup.rollup({
			input: 'samples/browser-object-main/main.js',
			onwarn: expectNoWarnings,
			plugins: [
				nodeResolve({
					mainFields: [ 'browser', 'main' ]
				})
			]
		}).then( executeBundle ).then( module => {
			assert.equal( module.exports.env, 'browser' );
			assert.equal( module.exports.dep, 'browser-dep' );
			assert.equal( module.exports.test, 43 );
		});
	});

	it( 'allows use of object browser field, resolving implicit `main`', function () {
		return rollup.rollup({
			input: 'samples/browser-object/main-implicit.js',
			onwarn: expectNoWarnings,
			plugins: [
				nodeResolve({
					mainFields: [ 'browser', 'main' ]
				})
			]
		}).then( executeBundle ).then( module => {
			assert.equal( module.exports.env, 'browser' );
		});
	});

	it( 'allows use of object browser field, resolving replaced builtins', function () {
		return rollup.rollup({
			input: 'samples/browser-object-builtin/main.js',
			onwarn: expectNoWarnings,
			plugins: [
				nodeResolve({
					mainFields: [ 'browser', 'main' ]
				})
			]
		}).then( executeBundle ).then( module => {
			assert.equal( module.exports, 'browser-fs' );
		});
	});

	it('respects local browser field', function () {
		return rollup.rollup({
			input: 'samples/browser-local/main.js',
			onwarn: expectNoWarnings,
			plugins: [
				nodeResolve({
					mainFields: ['browser', 'main']
				})
			]
		}).then(executeBundle).then(module => {
			assert.equal(module.exports, 'component-type');
		});
	});

	it( 'warns when importing builtins', function () {
		return rollup.rollup({
			input: 'samples/builtins/main.js',
			onwarn: expectWarnings([{
				code: 'UNRESOLVED_IMPORT',
				source: 'path'
			}]),
			plugins: [
				nodeResolve({
					mainFields: ['browser', 'main'],
					preferBuiltins: true
				})
			]
		}).then(executeBundle).then(module => {
			assert.equal(module.exports, require('path').sep);
		});
	});

	it( 'allows use of object browser field, resolving nested directories', function () {
		return rollup.rollup({
			input: 'samples/browser-object-nested/main.js',
			onwarn: expectNoWarnings,
			plugins: [
				nodeResolve({
					mainFields: [ 'browser', 'main' ]
				})
			]
		}).then( executeBundle ).then( module => {
			assert.equal( module.exports.env, 'browser' );
			assert.equal( module.exports.dep, 'browser-dep' );
			assert.equal( module.exports.test, 43 );
		});
	});

	it( 'allows use of object browser field, resolving `main`', function () {
		return rollup.rollup({
			input: 'samples/browser-object-main/main.js',
			onwarn: expectNoWarnings,
			plugins: [
				nodeResolve({
					mainFields: [ 'browser', 'main' ]
				})
			]
		}).then( executeBundle ).then( module => {
			assert.equal( module.exports.env, 'browser' );
			assert.equal( module.exports.dep, 'browser-dep' );
			assert.equal( module.exports.test, 43 );
		});
	});

	it( 'allows use of object browser field, resolving implicit `main`', function () {
		return rollup.rollup({
			input: 'samples/browser-object/main-implicit.js',
			onwarn: expectNoWarnings,
			plugins: [
				nodeResolve({
					mainFields: [ 'browser', 'main' ]
				})
			]
		}).then( executeBundle ).then( module => {
			assert.equal( module.exports.env, 'browser' );
		});
	});

	it( 'allows use of object browser field, resolving replaced builtins', function () {
		return rollup.rollup({
			input: 'samples/browser-object-builtin/main.js',
			onwarn: expectNoWarnings,
			plugins: [
				nodeResolve({
					mainFields: [ 'browser', 'main' ]
				})
			]
		}).then( executeBundle ).then( module => {
			assert.equal( module.exports, 'browser-fs' );
		});
	});

	it( 'allows use of object browser field, resolving nested directories', function () {
		return rollup.rollup({
			input: 'samples/browser-object-nested/main.js',
			onwarn: expectNoWarnings,
			plugins: [
				nodeResolve({
					mainFields: [ 'browser', 'main' ]
				})
			]
		}).then( executeBundle ).then( module => {
			assert.equal( module.exports.env, 'browser' );
			assert.equal( module.exports.dep, 'browser-dep' );
			assert.equal( module.exports.test, 43 );
		});
	});

	it( 'allows use of object browser field, resolving to nested node_modules', function () {
		return rollup.rollup({
			input: 'samples/browser-entry-points-to-node-module/index.js',
			onwarn: expectNoWarnings,
			plugins: [
				nodeResolve({
					main: true,
					browser: true
				})
			]
		}).then( executeBundle ).then( module => {
			assert.equal( module.exports, 'component-type' );
		});
	});

	it( 'supports `false` in browser field', function () {
		return rollup.rollup({
			input: 'samples/browser-false/main.js',
			onwarn: expectNoWarnings,
			plugins: [
				nodeResolve({
					mainFields: [ 'browser', 'main' ]
				})
			]
		}).then( executeBundle );
	});

	it( 'preferBuiltins: true allows preferring a builtin to a local module of the same name', () => {
		return rollup.rollup({
			input: 'samples/prefer-builtin/main.js',
			onwarn: expectWarnings([{
				code:'UNRESOLVED_IMPORT',
				source:'events'
			}]),
			plugins: [
				nodeResolve({
					preferBuiltins: true
				})
			]
		}).then(getBundleImports)
			.then(imports => assert.deepEqual(imports, ['events']));
	});

	it( 'preferBuiltins: false allows resolving a local module with the same name as a builtin module', () => {
		return rollup.rollup({
			input: 'samples/prefer-builtin/main.js',
			onwarn: expectWarnings([{
				code:'EMPTY_BUNDLE'
			}]),
			plugins: [
				nodeResolve({
					preferBuiltins: false
				})
			]
		}).then(getBundleImports)
			.then(imports => assert.deepEqual(imports, []));
	});

	it( 'issues a warning when preferring a builtin module without having explicit configuration', () => {
		let warning = null;
		return rollup.rollup({
			input: 'samples/prefer-builtin/main.js',
			onwarn ({message}) {
				if ( ~message.indexOf( 'preferring' ) ) {
					warning = message;
				}
			},
			plugins: [nodeResolve()]
		}).then( () => {
			const localPath = path.join(__dirname, 'node_modules/events/index.js');
			assert.strictEqual(
				warning,
				`preferring built-in module 'events' over local alternative ` +
				`at '${localPath}', pass 'preferBuiltins: false' to disable this behavior ` +
				`or 'preferBuiltins: true' to disable this warning`
			);
		});
	});

	it( 'supports non-standard extensions', () => {
		return rollup.rollup({
			input: 'samples/extensions/main.js',
			onwarn: expectNoWarnings,
			plugins: [
				nodeResolve({
					extensions: [ '.js', '.wut' ]
				})
			]
		}).then( executeBundle );
	});

	it( 'ignores IDs with null character', () => {
		return Promise.resolve( nodeResolve().resolveId( '\0someid', 'test.js' ) ).then( result => {
			assert.equal( result, null );
		});
	});

	it( 'finds a module with module field', () => {
		return rollup.rollup({
			input: 'samples/module/main.js',
			onwarn: expectNoWarnings,
			plugins: [
				nodeResolve({ preferBuiltins: false })
			]
		}).then( executeBundle ).then( module => {
			assert.equal( module.exports, 'MODULE' );
		});
	});

	it( 'respects order if given module,jsnext:main,main', () => {
		return rollup.rollup({
			input: 'samples/prefer-module/main.js',
			onwarn: expectNoWarnings,
			plugins: [
				nodeResolve({ mainFields: [ 'module', 'jsnext:main', 'main' ], preferBuiltins: false })
			]
		}).then( executeBundle ).then( module => {
			assert.equal( module.exports, 'MODULE-ENTRY' );
		});
	});

	it('finds and uses an .mjs module', function () {
		return rollup.rollup({
			input: 'samples/module-mjs/main.js',
			onwarn: expectNoWarnings,
			plugins: [
				nodeResolve({ preferBuiltins: false })
			]
		}).then( executeBundle ).then( module => {
			assert.equal( module.exports, 'MODULE-MJS' );
		});
	});

	it('finds and uses a dual-distributed .js & .mjs module', function () {
		return rollup.rollup({
			input: 'samples/dual-cjs-mjs/main.js',
			onwarn: expectNoWarnings,
			plugins: [
				nodeResolve({ preferBuiltins: false })
			]
		}).then( executeBundle ).then( module => {
			assert.equal( module.exports, 'DUAL-MJS' );
		});
	});

	it( 'keeps the order of [browser, module, jsnext, main] with all enabled', function () {
		return rollup.rollup({
			input: 'samples/browser/main.js',
			plugins: [
				nodeResolve({ main: true, browser: true, jsnext: true, module: true })
			]
		}).then( executeBundle ).then( module => {
			assert.equal( module.exports, 'browser' );
		});
	});

	it( 'should support disabling "module" field resolution', function () {
		return rollup.rollup({
			input: 'samples/prefer-main/main.js',
			plugins: [
				nodeResolve({ module: false })
			]
		}).then( executeBundle ).then( module => {
			assert.equal( module.exports, 'MAIN-ENTRY' );
		});
	});

	it( 'should support disabling "main" field resolution', function () {
		return rollup.rollup({
			input: 'samples/prefer-module/main.js',
			plugins: [
				nodeResolve({ main: false })
			]
		}).then( executeBundle ).then( module => {
			assert.equal( module.exports, 'MODULE-ENTRY' );
		});
	});

	it( 'should support enabling "jsnext" field resolution', function () {
		return rollup.rollup({
			input: 'samples/prefer-module/main.js',
			plugins: [
				nodeResolve({ main: false, module: false, jsnext: true })
			]
		}).then( executeBundle ).then( module => {
			assert.equal( module.exports, 'JSNEXT-ENTRY' );
		});
	});

	describe( 'symlinks', () => {
		function createMissingDirectories () {
			createDirectory( './samples/symlinked/first/node_modules' );
			createDirectory( './samples/symlinked/second/node_modules' );
			createDirectory( './samples/symlinked/third/node_modules' );
		}

		function createDirectory ( pathToDir ) {
			if ( !fs.existsSync( pathToDir ) ) {
				fs.mkdirSync( pathToDir );
			}
		}

		function linkDirectories () {
			fs.symlinkSync('../../second', './samples/symlinked/first/node_modules/second', 'dir');
			fs.symlinkSync('../../third', './samples/symlinked/first/node_modules/third', 'dir');
			fs.symlinkSync('../../third', './samples/symlinked/second/node_modules/third', 'dir');
		}

		function unlinkDirectories () {
			fs.unlinkSync('./samples/symlinked/first/node_modules/second');
			fs.unlinkSync('./samples/symlinked/first/node_modules/third');
			fs.unlinkSync('./samples/symlinked/second/node_modules/third');
		}

		beforeEach( () => {
			createMissingDirectories();
			linkDirectories();
		});

		afterEach( () => {
			unlinkDirectories();
		});

		it( 'resolves symlinked packages', () => {
			return rollup.rollup({
				input: 'samples/symlinked/first/index.js',
				onwarn: expectNoWarnings,
				plugins: [
					nodeResolve()
				]
			}).then( executeBundle ).then( module => {
				assert.equal( module.exports.number1, module.exports.number2 );
			});
		});

		it( 'preserves symlinks if `preserveSymlinks` is true', () => {
			return rollup.rollup({
				input: 'samples/symlinked/first/index.js',
				onwarn: expectNoWarnings,
				plugins: [
					nodeResolve()
				],
				preserveSymlinks: true
			}).then( executeBundle ).then( module => {
				assert.notEqual( module.exports.number1, module.exports.number2 );
			});
		});
	});

	it( 'respects order if given jsnext:main, main', () => {
		return rollup.rollup({
			input: 'samples/prefer-jsnext/main.js',
			onwarn: expectNoWarnings,
			plugins: [
				nodeResolve({ mainFields: ['jsnext:main', 'main'], preferBuiltins: false })
			]
		}).then( executeBundle ).then( module => {
			assert.equal( module.exports, 'JSNEXT-ENTRY' );
		});
	});

	it( 'supports ./ in entry filename', () => {
		return rollup.rollup({
			input: './samples/jsnext/main.js',
			onwarn: expectNoWarnings,
			plugins: [
				nodeResolve({})
			]
		}).then( executeBundle ).then( module => {
			assert.equal( module.exports, 'MAIN' );
		});
	});

	it( 'throws error if local id is not resolved', () => {
		const input = path.join( 'samples', 'unresolved-local', 'main.js' );
		return rollup.rollup({
			input,
			onwarn: expectNoWarnings,
			plugins: [
				nodeResolve()
			]
		}).then( () => {
			throw Error( 'test should fail' );
		}, err => {
			assert.equal( err.message, `Could not resolve './foo' from ${input}` );
		});
	});

	it( 'mark as external to module outside the jail', () => {
		return rollup.rollup({
			input: 'samples/jail/main.js',
			onwarn: expectWarnings([{
				code:'UNRESOLVED_IMPORT',
				source:'string/uppercase.js'
			}]),
			plugins: [ nodeResolve({
				jail: `${__dirname}/samples/`
			}) ]
		}).then(getBundleImports)
			.then(imports => assert.deepEqual(imports, ['string/uppercase.js']));
	});

	it( 'bundle module defined inside the jail', () => {
		return rollup.rollup({
			input: 'samples/jail/main.js',
			onwarn: expectNoWarnings,
			plugins: [ nodeResolve({
				jail: `${__dirname}/`
			}) ]
		}).then(getBundleImports)
			.then(imports => assert.deepEqual(imports, []));
	});

	it( '"only" option allows to specify the only packages to resolve', () => {
		return rollup.rollup({
			input: 'samples/only/main.js',
			onwarn: expectWarnings([{
				code:'UNRESOLVED_IMPORT',
				source:'@scoped/foo'
			}, {
				code:'UNRESOLVED_IMPORT',
				source:'@scoped/bar'
			}]),
			plugins: [
				nodeResolve({
					only: [ 'test' ]
				})
			]
		}).then(getBundleImports)
			.then(imports => assert.deepEqual(imports, ['@scoped/foo', '@scoped/bar']));
	});

	it( '"only" option works with a regex', () => {
		return rollup.rollup({
			input: 'samples/only/main.js',
			onwarn: expectWarnings([{
				code:'UNRESOLVED_IMPORT',
				source:'test'
			}]),
			plugins: [
				nodeResolve({
					only: [ /^@scoped\/.*$/ ]
				})
			]
		}).then(getBundleImports)
			.then(imports => assert.deepEqual(imports, ['test']));
	});

	it( 'allows custom options', () => {
		return rollup.rollup({
			input: 'samples/custom-resolve-options/main.js',
			onwarn: expectNoWarnings,
			plugins: [ nodeResolve({
				customResolveOptions: {
					moduleDirectory: 'js_modules'
				}
			}) ]
		}).then( bundle => {
			assert.equal(
				bundle.cache.modules[0].id,
				path.resolve( __dirname, 'samples/custom-resolve-options/js_modules/foo.js' )
			);
		});
	});

	it( 'ignores deep-import non-modules', () => {
		return rollup.rollup({
			input: 'samples/deep-import-non-module/main.js',
			onwarn: expectWarnings([{
				code:'UNRESOLVED_IMPORT',
				source:'foo/deep'
			}]),
			plugins: [ nodeResolve({
				modulesOnly: true
			}) ]
		}).then(getBundleImports)
			.then(imports => assert.deepEqual(imports, ['foo/deep']));
	});

	it( 'generates manual chunks', () => {
		const chunkName = 'mychunk';
		return rollup.rollup({
			input: 'samples/manualchunks/main.js',
			onwarn: expectNoWarnings,
			manualChunks: {
				[ chunkName ]: [ 'simple' ]
			},
			plugins: [ nodeResolve() ]
		}).then( bundle =>
			bundle.generate({
				format: 'esm',
				chunkFileNames: '[name]',
			})).then( generated => {
			assert.ok(generated.output.find(({fileName}) => fileName === chunkName));
		});
	});

	it('resolves dynamic imports', () => {
		return rollup.rollup({
			input: 'samples/dynamic/main.js',
			onwarn: expectNoWarnings,
			inlineDynamicImports: true,
			plugins: [ nodeResolve() ]
		}).then(executeBundle)
			.then(({exports}) => exports.then(result => assert.equal(result.default, 42)));
	});

	it( 'pkg.browser with mapping to prevent bundle by specifying a value of false', () => {
		return rollup.rollup({
			input: 'samples/browser-object-with-false/main.js',
			plugins: [
				nodeResolve({ browser: true }),
				commonjs()
			]
		}).then( executeBundle ).then( module => {
			assert.equal( module.exports, 'ok' );
		});
	});

	it( 'single module version is bundle if dedupe is set', () => {
		return rollup.rollup({
			input: 'samples/react-app/main.js',
			plugins: [
				nodeResolve({
					dedupe: [ 'react' ]
				})
			]
		}).then( executeBundle ).then( module => {
			assert.deepEqual(module.exports, {
				React: 'react:root',
				ReactConsumer: 'react-consumer:react:root'
			});
		});
	});

	it( 'single module version is bundle if dedupe is set as a function', () => {
		return rollup.rollup({
			input: 'samples/react-app/main.js',
			plugins: [
				nodeResolve({
					dedupe: (dep) => dep === 'react'
				})
			]
		}).then( executeBundle ).then( module => {
			assert.deepEqual(module.exports, {
				React: 'react:root',
				ReactConsumer: 'react-consumer:react:root'
			});
		});
	});

	it( 'multiple module versions are bundled if dedupe is not set', () => {
		return rollup.rollup({
			input: 'samples/react-app/main.js',
			plugins: [
				nodeResolve()
			]
		}).then( executeBundle ).then( module => {
			assert.deepEqual(module.exports, {
				React: 'react:root',
				ReactConsumer: 'react-consumer:react:child'
			});
		});
	});

	it('handles package side-effects', () =>
		rollup.rollup({
			input: 'samples/side-effects/main.js',
			plugins: [nodeResolve()]
		}).then(executeBundle).then(() => {
			assert.deepStrictEqual(global.sideEffects, [
				'false-dep1',
				'true-dep1',
				'true-dep2',
				'true-index',
				'array-dep1',
				'array-dep3',
				'array-dep5',
				'array-index'
			]);
			delete global.sideEffects;
		}));
});
