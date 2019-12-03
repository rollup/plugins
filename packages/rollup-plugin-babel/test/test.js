var assert = require('assert');
var path = require('path');
var rollup = require('rollup');
var SourceMapConsumer = require('source-map').SourceMapConsumer;
var jsonPlugin = require('rollup-plugin-json');
var babelPlugin = require('..');

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

describe('rollup-plugin-babel when used as an input plugin', function() {
	async function bundle(input, babelOptions = {}, generateOptions = {}, rollupOptions = {}) {
		const bundle = await rollup.rollup({
			input,
			plugins: [babelPlugin(babelOptions)],
			...rollupOptions,
		});

		const {
			output: [generated],
		} = await bundle.generate(Object.assign({ format: 'cjs' }, generateOptions));

		return generated;
	}

	it('runs code through babel', async () => {
		const { code } = await bundle('samples/basic/main.js');
		assert.ok(code.indexOf('const') === -1, code);
		assert.strictEqual(
			code,
			`'use strict';

var answer = 42;
console.log("the answer is ".concat(answer));
`,
		);
	});

	it('adds helpers', async () => {
		const { code } = await bundle('samples/class/main.js');
		assert.ok(code.indexOf('function _classCallCheck') !== -1, code);
	});

	it('adds helpers in loose mode', async () => {
		const { code } = await bundle('samples/class-loose/main.js');
		assert.ok(code.indexOf('function _inherits') !== -1, code);
	});

	it('does not babelify excluded code', async () => {
		const { code } = await bundle('samples/exclusions/main.js', { exclude: '**/foo.js' });
		assert.ok(code.indexOf('${foo()}') === -1, code);
		assert.ok(code.indexOf('=> 42') !== -1, code);
		assert.strictEqual(
			code,
			`'use strict';

const foo = () => 42;

console.log("the answer is ".concat(foo()));
`,
		);
	});

	it('generates sourcemap by default', async () => {
		const { code, map } = await bundle('samples/class/main.js', {}, { sourcemap: true });
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

	it('works with proposal-decorators (#18)', () => {
		return rollup.rollup({
			input: 'samples/proposal-decorators/main.js',
			plugins: [babelPlugin()],
		});
	});

	it('checks config per-file', async () => {
		const bundle = await rollup.rollup({
			input: 'samples/checks/main.js',
			plugins: [babelPlugin()],
		});
		const {
			output: [{ code }],
		} = await bundle.generate({ output: { format: 'esm' } });
		assert.ok(/class Foo/.test(code));
		assert.ok(/var Bar/.test(code));
		assert.ok(!/class Bar/.test(code));
	});

	it('allows transform-runtime to be used instead of bundled helpers', async () => {
		const warnings = [];
		const { code } = await bundle(
			'samples/runtime-helpers/main.js',
			{ runtimeHelpers: true },
			{},
			{
				onwarn(warning) {
					warnings.push(warning.message);
				},
			},
		);
		assert.deepStrictEqual(warnings, [
			`'@babel/runtime/helpers/classCallCheck' is imported by samples${path.sep}runtime-helpers${path.sep}main.js, but could not be resolved – treating it as an external dependency`,
		]);
		assert.strictEqual(
			code,
			`'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var _classCallCheck = _interopDefault(require('@babel/runtime/helpers/classCallCheck'));

var Foo = function Foo() {
  _classCallCheck(this, Foo);
};

module.exports = Foo;
`,
		);
	});

	it('allows transform-runtime to inject esm version of helpers', async () => {
		const warnings = [];
		const { code } = await bundle(
			'samples/runtime-helpers-esm/main.js',
			{ runtimeHelpers: true },
			{
				format: 'esm',
			},
			{
				onwarn(warning) {
					warnings.push(warning.message);
				},
			},
		);
		assert.deepStrictEqual(warnings, [
			`'@babel/runtime/helpers/esm/classCallCheck' is imported by samples${path.sep}runtime-helpers-esm${path.sep}main.js, but could not be resolved – treating it as an external dependency`,
		]);
		assert.strictEqual(
			code,
			`import _classCallCheck from '@babel/runtime/helpers/esm/classCallCheck';

var Foo = function Foo() {
  _classCallCheck(this, Foo);
};

export default Foo;
`,
		);
	});

	it('allows transform-runtime to be used instead of bundled helpers, but throws when CommonJS is used', async () => {
		try {
			await bundle('samples/runtime-helpers-commonjs/main.js', { runtimeHelpers: true });
			assert.ok(false);
		} catch (error) {
			assert.ok(
				~error.message.indexOf('Rollup requires that your Babel configuration keeps ES6 module syntax intact.'),
			);
		}
	});

	it('allows using external-helpers plugin in combination with externalHelpers flag', async () => {
		const { code } = await bundle('samples/external-helpers/main.js', { externalHelpers: true });
		assert.ok(code.indexOf('function _classCallCheck') === -1);
		assert.ok(code.indexOf('babelHelpers.classCallCheck') !== -1);
		assert.strictEqual(
			code,
			`'use strict';

var Foo = function Foo() {
  babelHelpers.classCallCheck(this, Foo);
};

var Bar = function Bar() {
  babelHelpers.classCallCheck(this, Bar);
};

var main = [new Foo(), new Bar()];

module.exports = main;
`,
		);
	});

	it('warns about deprecated usage with external-helpers plugin (without externalHelpers flag)', async () => {
		const messages = [];
		const originalWarn = console.warn;
		console.warn = msg => {
			messages.push(msg);
		};

		try {
			await bundle('samples/external-helpers/main.js');
		} finally {
			// eslint-disable-next-line require-atomic-updates
			console.warn = originalWarn;
		}

		assert.deepEqual(messages, [
			'Using "external-helpers" plugin with rollup-plugin-babel is deprecated, as it now automatically deduplicates your Babel helpers.',
		]);
	});

	it('correctly renames helpers (#22)', async () => {
		const { code } = await bundle('samples/named-function-helper/main.js');
		assert.ok(!~code.indexOf('babelHelpers_get get'), 'helper was incorrectly renamed');
	});

	it('runs preflight check correctly in absence of class transformer (#23)', () => {
		return rollup.rollup({
			input: 'samples/no-class-transformer/main.js',
			plugins: [babelPlugin()],
		});
	});

	it('produces valid code with typeof helper', async () => {
		const { code } = await bundle('samples/typeof/main.js');
		assert.equal(code.indexOf('var typeof'), -1, code);
	});

	it('handles babelrc with ignore option used', async () => {
		const { code } = await bundle('samples/ignored-file/main.js');
		assert.ok(code.indexOf('class Ignored') !== -1);
	});

	it('transpiles only files with default extensions', async () => {
		const { code } = await bundle('samples/extensions-default/main.js', undefined, undefined, {
			plugins: [babelPlugin(), jsonPlugin()],
		});
		assert.ok(code.indexOf('class Es ') === -1, 'should transpile .es');
		assert.ok(code.indexOf('class Es6 ') === -1, 'should transpile .es6');
		assert.ok(code.indexOf('class Js ') === -1, 'should transpile .js');
		assert.ok(code.indexOf('class Jsx ') === -1, 'should transpile .jsx');
		assert.ok(code.indexOf('class Mjs ') === -1, 'should transpile .mjs');
		assert.ok(code.indexOf('class Other ') !== -1, 'should not transpile .other');
	});

	it('transpiles only files with whitelisted extensions', async () => {
		const { code } = await bundle('samples/extensions-custom/main.js', {
			extensions: ['.js', '.other'],
		});
		assert.ok(code.indexOf('class Es ') !== -1, 'should not transpile .es');
		assert.ok(code.indexOf('class Es6 ') !== -1, 'should not transpile .es6');
		assert.ok(code.indexOf('class Js ') === -1, 'should transpile .js');
		assert.ok(code.indexOf('class Jsx ') !== -1, 'should not transpile .jsx');
		assert.ok(code.indexOf('class Mjs ') !== -1, 'should not transpile .mjs');
		assert.ok(code.indexOf('class Other ') === -1, 'should transpile .other');
	});

	it('throws when trying to add babel helper unavailable in used @babel/core version', async () => {
		try {
			await bundle('samples/basic/main.js', {
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
			});
			assert.ok(false);
		} catch (err) {
			assert.equal(
				err.message,
				`${path.resolve(__dirname, 'samples', 'basic', 'main.js')}: Unknown helper __nonexistentHelper`,
			);
		}
	});

	it('supports customizing the loader', async () => {
		const customBabelPlugin = babelPlugin.custom(() => ({
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
		}));
		const bundle = await rollup.rollup({ input: 'samples/basic/main.js', plugins: [customBabelPlugin()] });
		const {
			output: [{ code }],
		} = await bundle.generate({ format: 'cjs' });
		assert.ok(code.includes('// Generated by some custom loader'), 'adds the custom comment');
		assert.ok(code.includes('console.foobaz'), 'runs the plugin');
	});

	it('supports overriding the plugin options in custom loader', async () => {
		const customBabelPlugin = babelPlugin.custom(() => ({
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
		}));
		const bundle = await rollup.rollup({ input: 'samples/basic/main.js', plugins: [customBabelPlugin()] });
		const {
			output: [{ code }],
		} = await bundle.generate({ format: 'cjs' });
		assert.ok(!code.includes('// Generated by some custom loader'), 'does not add the comment to ignored file');
		assert.ok(!code.includes('console.foobaz'), 'does not run the plugin on ignored file');
	});

	it('uses babel plugins passed in to the rollup plugin', async () => {
		const { code } = await bundle('samples/basic/main.js', {
			plugins: [[replaceConsoleLogProperty, { replace: 'foobaz' }]],
		});
		assert.ok(code.indexOf('console.foobaz') !== -1);
	});

	it('can be used as an input plugin while transforming the output', async () => {
		const bundle = await rollup.rollup({
			input: 'samples/basic/main.js',
			plugins: [
				babelPlugin.generated({
					presets: ['@babel/env'],
				}),
			],
		});
		const {
			output: [{ code }],
		} = await bundle.generate({ format: 'cjs' });
		assert.ok(code.indexOf('const') === -1, code);
	});
});

describe('rollup-plugin-babel when used as an output plugin', function() {
	async function bundleWithOutputPlugin(input, babelOptions = {}, generateOptions = {}, rollupOptions = {}) {
		const bundle = await rollup.rollup(Object.assign({ input }, rollupOptions));
		const {
			output: [generated],
		} = await bundle.generate({
			format: 'cjs',
			plugins: [babelPlugin.generated(babelOptions)],
			...generateOptions,
		});
		return generated;
	}

	it('allows running the plugin on the output via output options', async () => {
		const { code } = await bundleWithOutputPlugin('samples/basic/main.js', {
			presets: ['@babel/env'],
		});
		assert.ok(code.indexOf('const') === -1, code);
	});

	it('ignores .babelrc when transforming the output by default', async () => {
		const { code } = await bundleWithOutputPlugin('samples/basic/main.js');
		assert.ok(code.indexOf('const') !== -1, code);
	});

	it("allows transform-runtime to be used with `useESModules: false` (the default) and `format: 'cjs'`", async () => {
		const { code } = await bundleWithOutputPlugin(
			'samples/runtime-helpers/main.js',
			{
				presets: ['@babel/env'],
				plugins: [['@babel/transform-runtime', { useESModules: false }]],
			},
			{ format: 'cjs' },
		);
		assert.strictEqual(
			code,
			`'use strict';

var _classCallCheck = require("@babel/runtime/helpers/classCallCheck");

var Foo = function Foo() {
  _classCallCheck(this, Foo);
};

module.exports = Foo;
`,
		);
	});

	it("allows transform-runtime to be used with `useESModules: true` and `format: 'esm'`", async () => {
		const { code } = await bundleWithOutputPlugin(
			'samples/runtime-helpers/main.js',
			{
				presets: ['@babel/env'],
				plugins: [['@babel/transform-runtime', { useESModules: true }]],
			},
			{ format: 'esm' },
		);
		assert.strictEqual(
			code,
			`import _classCallCheck from "@babel/runtime/helpers/esm/classCallCheck";

var Foo = function Foo() {
  _classCallCheck(this, Foo);
};

export default Foo;
`,
		);
	});

	it('generates sourcemap by default', async () => {
		const { code, map } = await bundleWithOutputPlugin('samples/class/main.js', {}, { sourcemap: true });
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

	it('allows using external-helpers plugin even if the externalHelpers flag is not passed', async () => {
		const warnings = [];
		const { code } = await bundleWithOutputPlugin(
			'samples/external-helpers/main.js',
			{
				presets: ['@babel/env'],
				plugins: ['@babel/external-helpers'],
			},
			{},
			{
				onwarn(warning) {
					warnings.push(warning.message);
				},
			},
		);
		assert.deepStrictEqual(warnings, []);
		assert.ok(code.indexOf('function _classCallCheck') === -1);
		assert.ok(code.indexOf('babelHelpers.classCallCheck') !== -1);
		assert.strictEqual(
			code,
			`'use strict';

var Foo = function Foo() {
  babelHelpers.classCallCheck(this, Foo);
};

var Bar = function Bar() {
  babelHelpers.classCallCheck(this, Bar);
};

var main = [new Foo(), new Bar()];
module.exports = main;
`,
		);
	});

	it('warns when using the "include" option', async () => {
		const warnings = [];
		await bundleWithOutputPlugin(
			'samples/basic/main.js',
			{
				include: ['*.js'],
			},
			{},
			{
				onwarn(warning) {
					warnings.push(warning.message);
				},
			},
		);
		assert.deepStrictEqual(warnings, [
			'The "include", "exclude" and "extensions" options are ignored when transforming the output.',
		]);
	});

	it('transforms all chunks in a code-splitting setup', async () => {
		const bundle = await rollup.rollup({ input: 'samples/chunks/main.js' });
		const { output } = await bundle.generate({
			format: 'esm',
			plugins: [
				babelPlugin.generated({
					plugins: ['@babel/syntax-dynamic-import'],
					presets: ['@babel/env'],
				}),
			],
		});
		assert.deepStrictEqual(
			output.map(({ code }) => code),
			[
				`import('./dep-5f996703.js').then(function (result) {
  return console.log(result);
});
`,
				`var dep = function dep() {
  return 42;
};

export default dep;
`,
			],
		);
	});

	it('transforms all chunks when preserving modules', async () => {
		const bundle = await rollup.rollup({
			input: 'samples/preserve-modules/main.js',
			preserveModules: true,
		});
		const { output } = await bundle.generate({
			format: 'esm',
			plugins: [
				babelPlugin.generated({
					presets: ['@babel/env'],
				}),
			],
		});
		assert.deepStrictEqual(
			output.map(({ code }) => code),
			[
				`import getResult from './dep.js';
var value = 42;
console.log(getResult(value));
`,
				`var getResult = function getResult(value) {
  return value + 1;
};

export default getResult;
`,
			],
		);
	});

	it('supports customizing the loader', async () => {
		const customBabelPlugin = babelPlugin.generated.custom(() => ({
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
		}));
		const bundle = await rollup.rollup({ input: 'samples/basic/main.js' });
		const {
			output: [{ code }],
		} = await bundle.generate({ format: 'cjs', plugins: [customBabelPlugin()] });
		assert.ok(code.includes('// Generated by some custom loader'), 'adds the custom comment');
		assert.ok(code.includes('console.foobaz'), 'runs the plugin');
	});

	it('throws when using a Rollup output format other than esm or cjs', async () => {
		try {
			await bundleWithOutputPlugin('samples/basic/main.js', {}, { format: 'iife' });
			throw new Error('Rollup did not throw');
		} catch (error) {
			assert.strictEqual(
				error.message,
				`Using Babel on the generated chunks is strongly discouraged for formats other than "esm" or "cjs" as it can easily break wrapper code and lead to accidentally created global variables. Instead, you should set "output.format" to "esm" and use Babel to transform to another format, e.g. by adding "presets: [['@babel/env', { modules: 'umd' }]]" to your Babel options. If you still want to proceed, add "allowAllFormats: true" to your plugin options.`,
			);
		}
	});

	it('allows using a Rollup output format other than esm or cjs with allowAllFormats', async () => {
		const { code } = await bundleWithOutputPlugin(
			'samples/basic/main.js',
			{ presets: ['@babel/env'], allowAllFormats: true },
			{ format: 'iife' },
		);
		assert.strictEqual(
			code,
			`(function () {
  'use strict';

  var answer = 42;
  console.log("the answer is ".concat(answer));
})();
`,
		);
	});

	it('allows using Babel to transform to other formats', async () => {
		const { code } = await bundleWithOutputPlugin(
			'samples/basic/main.js',
			{ presets: [['@babel/env', { modules: 'umd' }]] },
			{ format: 'esm' },
		);
		assert.strictEqual(
			code,
			`(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define([], factory);
  } else if (typeof exports !== "undefined") {
    factory();
  } else {
    var mod = {
      exports: {}
    };
    factory();
    global.unknown = mod.exports;
  }
})(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var answer = 42;
  console.log("the answer is ".concat(answer));
});
`,
		);
	});

	it('loads configuration files when configFile is passed', async () => {
		const { code } = await bundleWithOutputPlugin('samples/config-file/main.js', {
			configFile: path.resolve(__dirname, 'samples/config-file/config.json'),
		});
		assert.strictEqual(
			code,
			`'use strict';

const answer = Math.pow(42, 2);
console.log(\`the answer is \${answer}\`);
`,
		);
	});
});
