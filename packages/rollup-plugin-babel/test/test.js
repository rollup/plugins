var assert = require('assert');
var path = require('path');
var rollup = require('rollup');
var SourceMapConsumer = require('source-map').SourceMapConsumer;
var jsonPlugin = require('rollup-plugin-json');
var babelPlugin = require('..');

// from ./src/constants
var HELPERS = '\0rollupPluginBabelHelpers.js';

require('source-map-support').install();

process.chdir(__dirname);

function getLocation(source, charIndex) {
	var lines = source.split('\n');
	var len = lines.length;

	var lineStart = 0;
	var i;

	for (i = 0; i < len; i += 1) {
		var line = lines[i];
		var lineEnd = lineStart + line.length + 1; // +1 for newline

		if (lineEnd > charIndex) {
			return { line: i + 1, column: charIndex - lineStart };
		}

		lineStart = lineEnd;
	}

	throw new Error('Could not determine location of character');
}

function replaceConsoleLogProperty() {
	return {
		name: 'replace-console-log-property',
		visitor: {
			MemberExpression(path, state) {
				const opts = state.opts;
				if (path.node.property.name === 'log') {
					path.node.property.name = opts.replace;
				}
			},
		},
	};
}

describe('rollup-plugin-babel', function() {
	this.timeout(15000);

	function bundle(input, babelOptions = {}, generateOptions = {}, rollupOptions = {}) {
		return rollup
			.rollup(
				Object.assign(
					{
						input,
						plugins: [babelPlugin(babelOptions)],
					},
					rollupOptions,
				),
			)
			.then(bundle => {
				return bundle.generate(Object.assign({ format: 'cjs' }, generateOptions));
			})
			.then(({ output: [generated] }) => generated);
	}

	it('runs code through babel', () => {
		return bundle('samples/basic/main.js').then(({ code }) => {
			assert.ok(code.indexOf('const') === -1, code);
		});
	});

	it('adds helpers', () => {
		return bundle('samples/class/main.js').then(({ code }) => {
			assert.ok(code.indexOf('function _classCallCheck') !== -1, code);
		});
	});

	it('adds helpers in loose mode', () => {
		return bundle('samples/class-loose/main.js').then(({ code }) => {
			assert.ok(code.indexOf('function _inherits') !== -1, code);
		});
	});

	it('does not add helpers unnecessarily', () => {
		return bundle('samples/basic/main.js').then(({ code }) => {
			assert.ok(code.indexOf(HELPERS) === -1, code);
		});
	});

	it('does not babelify excluded code', () => {
		return bundle('samples/exclusions/main.js', { exclude: '**/foo.js' }).then(({ code }) => {
			assert.ok(code.indexOf('${foo()}') === -1, code);
			assert.ok(code.indexOf('=> 42') !== -1, code);
		});
	});

	it('generates sourcemap by default', () => {
		return bundle('samples/class/main.js', {}, { sourcemap: true }).then(({ code, map }) => {
			const target = 'log';
			const smc = new SourceMapConsumer(map);
			const loc = getLocation(code, code.indexOf(target));
			const original = smc.originalPositionFor(loc);

			assert.deepEqual(original, {
				source: 'samples/class/main.js'.split(path.sep).join('/'),
				line: 3,
				column: 10,
				name: target,
			});
		});
	});

	it('works with proposal-decorators (#18)', () => {
		return rollup.rollup({
			input: 'samples/proposal-decorators/main.js',
			plugins: [babelPlugin()],
		});
	});

	it('checks config per-file', () => {
		return rollup
			.rollup({
				input: 'samples/checks/main.js',
				plugins: [babelPlugin()],
			})
			.then(bundle => bundle.generate({ output: { format: 'esm' } }))
			.then(({ output: [{ code }] }) => {
				assert.ok(/class Foo/.test(code));
				assert.ok(/var Bar/.test(code));
				assert.ok(!/class Bar/.test(code));
			})
			.catch(err => {
				assert.ok(false, err.message);
			});
	});

	it('allows transform-runtime to be used instead of bundled helpers', () => {
		let warnCalled = false;
		return bundle(
			'samples/runtime-helpers/main.js',
			{ runtimeHelpers: true },
			{},
			{
				onwarn: function(warning) {
					assert.equal(warning.code, 'UNRESOLVED_IMPORT');
					assert.equal(warning.source, '@babel/runtime/helpers/classCallCheck');
					warnCalled = true;
				},
			},
		).then(({ code }) => {
			assert.ok(warnCalled, 'onwarn was never triggered about unresolved imports');
			assert.ok(!~code.indexOf(HELPERS));
		});
	});

	it('allows transform-runtime to inject builtin version of helpers', () => {
		return bundle('samples/runtime-helpers-esm/main.js', { runtimeHelpers: true }, {}, {}).then(({ code }) => {
			assert.ok(!~code.indexOf(HELPERS));
		});
	});

	it('allows transform-runtime to inject esm version of helpers', () => {
		return bundle('samples/runtime-helpers-esm/main.js', { runtimeHelpers: true }, {}, {}).then(({ code }) => {
			assert.ok(!~code.indexOf(HELPERS));
		});
	});

	it('allows transform-runtime to be used instead of bundled helpers, but throws when CommonJS is used', () => {
		return bundle('samples/runtime-helpers-commonjs/main.js', { runtimeHelpers: true })
			.then(() => {
				assert.ok(false);
			})
			.catch(error => {
				assert.ok(
					~error.message.indexOf('Rollup requires that your Babel configuration keeps ES6 module syntax intact.'),
				);
			});
	});

	it('allows using external-helpers plugin in combination with externalHelpers flag', () => {
		return bundle('samples/external-helpers/main.js', { externalHelpers: true }).then(({ code }) => {
			assert.ok(code.indexOf('function _classCallCheck') === -1);
			assert.ok(code.indexOf('babelHelpers.classCallCheck') !== -1);
		});
	});

	it('warns about deprecated usage with external-helpers plugin (without externalHelpers flag)', () => {
		/* eslint-disable no-console */
		const messages = [];
		const originalWarn = console.warn;
		console.warn = msg => {
			messages.push(msg);
		};
		return bundle('samples/external-helpers/main.js').then(() => {
			console.warn = originalWarn;

			assert.deepEqual(messages, [
				'Using "external-helpers" plugin with rollup-plugin-babel is deprecated, as it now automatically deduplicates your Babel helpers.',
			]);
		});
		/* eslint-enable no-console */
	});

	it('correctly renames helpers (#22)', () => {
		return bundle('samples/named-function-helper/main.js').then(({ code }) => {
			assert.ok(!~code.indexOf('babelHelpers_get get'), 'helper was incorrectly renamed');
		});
	});

	it('runs preflight check correctly in absence of class transformer (#23)', () => {
		return rollup.rollup({
			input: 'samples/no-class-transformer/main.js',
			plugins: [babelPlugin()],
		});
	});

	it('produces valid code with typeof helper', () => {
		return bundle('samples/typeof/main.js').then(({ code }) => {
			assert.equal(code.indexOf('var typeof'), -1, code);
		});
	});

	it('handles babelrc with ignore option used', () => {
		return bundle('samples/ignored-file/main.js').then(({ code }) => {
			assert.ok(code.indexOf('class Ignored') !== -1);
		});
	});

	it('transpiles only files with default extensions', () => {
		return bundle('samples/extensions-default/main.js', undefined, undefined, {
			plugins: [babelPlugin(), jsonPlugin()],
		}).then(({ code }) => {
			assert.ok(code.indexOf('class Es ') === -1, 'should transpile .es');
			assert.ok(code.indexOf('class Es6 ') === -1, 'should transpile .es6');
			assert.ok(code.indexOf('class Js ') === -1, 'should transpile .js');
			assert.ok(code.indexOf('class Jsx ') === -1, 'should transpile .jsx');
			assert.ok(code.indexOf('class Mjs ') === -1, 'should transpile .mjs');
			assert.ok(code.indexOf('class Other ') !== -1, 'should not transpile .other');
		});
	});

	it('transpiles only files with whitelisted extensions', () => {
		return bundle('samples/extensions-custom/main.js', {
			extensions: ['.js', '.other'],
		}).then(({ code }) => {
			assert.ok(code.indexOf('class Es ') !== -1, 'should not transpile .es');
			assert.ok(code.indexOf('class Es6 ') !== -1, 'should not transpile .es6');
			assert.ok(code.indexOf('class Js ') === -1, 'should transpile .js');
			assert.ok(code.indexOf('class Jsx ') !== -1, 'should not transpile .jsx');
			assert.ok(code.indexOf('class Mjs ') !== -1, 'should not transpile .mjs');
			assert.ok(code.indexOf('class Other ') === -1, 'should transpile .other');
		});
	});

	it('throws when trying to add babel helper unavailable in used @babel/core version', () => {
		return bundle('samples/basic/main.js', {
			plugins: [
				function() {
					return {
						visitor: {
							Program(path, state) {
								state.file.addHelper('__nonexistentHelper');
							},
						},
					};
				},
			],
		}).then(
			() => {
				assert.ok(false);
			},
			err => {
				assert.equal(err.message, 'Unknown helper __nonexistentHelper');
			},
		);
	});

	it('supports customizing the loader', () => {
		const customBabelPlugin = babelPlugin.custom(() => {
			return {
				config(cfg) {
					return Object.assign({}, cfg.options, {
						plugins: [
							...(cfg.options.plugins || []),

							// Include a custom plugin in the options.
							[replaceConsoleLogProperty, { replace: 'foobaz' }],
						],
					});
				},
				result(result) {
					return Object.assign({}, result, { code: result.code + '\n// Generated by some custom loader' });
				},
			};
		});
		return rollup
			.rollup({ input: 'samples/basic/main.js', plugins: [customBabelPlugin()] })
			.then(bundle => {
				return bundle.generate({ format: 'cjs' });
			})
			.then(({ output: [{ code }] }) => {
				assert.ok(code.includes('// Generated by some custom loader'), 'adds the custom comment');
				assert.ok(code.includes('console.foobaz'), 'runs the plugin');
			});
	});

	it('supports overriding the plugin options in custom loader', () => {
		const customBabelPlugin = babelPlugin.custom(() => {
			return {
				options(options) {
					// Ignore the js extension to test overriding the options
					return { pluginOptions: Object.assign({}, options, { extensions: ['.x'] }) };
				},
				config(cfg) {
					return Object.assign({}, cfg.options, {
						plugins: [
							...(cfg.options.plugins || []),
							// Include a custom plugin in the options.
							[replaceConsoleLogProperty, { replace: 'foobaz' }],
						],
					});
				},
				result(result) {
					return Object.assign({}, result, { code: result.code + '\n// Generated by some custom loader' });
				},
			};
		});
		return rollup
			.rollup({ input: 'samples/basic/main.js', plugins: [customBabelPlugin()] })
			.then(bundle => {
				return bundle.generate({ format: 'cjs' });
			})
			.then(({ output: [{ code }] }) => {
				assert.ok(!code.includes('// Generated by some custom loader'), 'does not add the comment to ignored file');
				assert.ok(!code.includes('console.foobaz'), 'does not run the plugin on ignored file');
			});
	});

	it('uses babel plugins passed in to the rollup plugin', () => {
		return bundle('samples/basic/main.js', {
			plugins: [[replaceConsoleLogProperty, { replace: 'foobaz' }]],
		}).then(({ code }) => {
			assert.ok(code.indexOf('console.foobaz') !== -1);
		});
	});
});
