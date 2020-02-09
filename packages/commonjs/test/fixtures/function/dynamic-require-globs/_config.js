module.exports = {
	description: 'supports glob patterns',
	pluginOptions: {
		dynamicRequireTargets: [
			'fixtures/function/dynamic-require-globs/s*.js',
			'fixtures/function/dynamic-require-globs/e*.*',
			'!fixtures/function/dynamic-require-globs/e*2.js'
		]
	}
};
