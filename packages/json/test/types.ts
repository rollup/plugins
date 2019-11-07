// @ts-check
import json from '.';

/** @type {import("rollup").RollupOptions} */
const config = {
	input: 'main.js',
	output: {
		file: 'bundle.js',
		format: 'iife'
	},
	plugins: [
		json({
			include: 'node_modules/**',
			exclude: ['node_modules/foo/**', 'node_modules/bar/**'],
			preferConst: true,
			indent: '  ',
			compact: true,
			namedExports: true
		})
	]
};

export default config;
