import * as babel from '@babel/core';

export default function(code, babelOptions, overrides, customOptions, ctx, finalizeOptions) {
	const config = babel.loadPartialConfig(babelOptions);

	if (!config) {
		return Promise.resolve(null);
	}

	return Promise.resolve(
		!overrides.config
			? config.options
			: overrides.config.call(this, config, {
					code,
					customOptions,
			  }),
	)
		.then(transformOptions => {
			if (finalizeOptions) {
				transformOptions = finalizeOptions(transformOptions);
			}

			const resultP = babel.transformAsync(code, transformOptions);

			if (!overrides.result) {
				return resultP;
			}
			return resultP.then(result =>
				overrides.result.call(ctx, result, {
					code,
					customOptions,
					config,
					transformOptions,
				}),
			);
		})
		.then(({ code, map }) => ({ code, map }));
}
