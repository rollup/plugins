module.exports = {
	description: 'works when the entry point is an es module',
	pluginOptions: {
		dynamicRequireTargets: ['fixtures/function/dynamic-require-es-entry/submodule.js']
	}
};
