import * as babel from '@babel/core';
import { INLINE, RUNTIME, EXTERNAL, BUNDLED } from './constants.js';
import { addBabelPlugin } from './utils.js';

const MODULE_ERROR =
	'Rollup requires that your Babel configuration keeps ES6 module syntax intact. ' +
	'Unfortunately it looks like your configuration specifies a module transformer ' +
	'to replace ES6 modules with another module format. To continue you have to disable it.' +
	'\n\n' +
	"Most commonly it's a CommonJS transform added by @babel/preset-env - " +
	'in such case you should disable it by adding `modules: false` option to that preset ' +
	'(described in more detail here - https://github.com/rollup/rollup-plugin-babel#modules ).';

const UNEXPECTED_ERROR =
	'An unexpected situation arose. Please raise an issue at ' +
	'https://github.com/rollup/rollup-plugin-babel/issues. Thanks!';

const PREFLIGHT_TEST_STRING = '__ROLLUP__PREFLIGHT_CHECK_DO_NOT_TOUCH__';
const PREFLIGHT_INPUT = `export default "${PREFLIGHT_TEST_STRING}";`;

function helpersTestTransform() {
	return {
		visitor: {
			StringLiteral(path, state) {
				if (path.node.value === PREFLIGHT_TEST_STRING) {
					path.replaceWith(state.file.addHelper('inherits'));
				}
			},
		},
	};
}

const mismatchError = (actual, expected, filename) =>
	`You have declared using "${expected}" babelHelpers, but transforming ${filename} resulted in "${actual}". Please check your configuration.`;

const inheritsHelperRe = /\/helpers\/(esm\/)?inherits/;

export default async function preflightCheck(ctx, babelHelpers, transformOptions) {
	const finalOptions = addBabelPlugin(transformOptions, helpersTestTransform);
	const check = (await babel.transformAsync(PREFLIGHT_INPUT, finalOptions)).code;

	// Babel sometimes splits ExportDefaultDeclaration into 2 statements, so we also check for ExportNamedDeclaration
	if (!/export (d|{)/.test(check)) {
		ctx.error(MODULE_ERROR);
	}

	if (inheritsHelperRe.test(check)) {
		if (babelHelpers === RUNTIME) {
			return;
		}
		ctx.error(mismatchError(RUNTIME, babelHelpers, transformOptions.filename));
	}

	if (check.includes('babelHelpers.inherits')) {
		if (babelHelpers === EXTERNAL) {
			return;
		}
		ctx.error(mismatchError(EXTERNAL, babelHelpers, transformOptions.filename));
	}

	// test unminifiable string content
	if (check.includes('Super expression must either be null or a function')) {
		if (babelHelpers === INLINE || babelHelpers === BUNDLED) {
			return;
		}
		if (babelHelpers === RUNTIME && !transformOptions.plugins.length) {
			ctx.error(`You must use the \`@babel/plugin-transform-runtime\` plugin when \`babelHelpers\` is "${RUNTIME}".\n`);
		}
		ctx.error(mismatchError(INLINE, babelHelpers, transformOptions.filename));
	}

	ctx.error(UNEXPECTED_ERROR);
}
