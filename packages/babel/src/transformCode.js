import * as babel from '@babel/core';

export default async function transformCode(inputCode, babelOptions, overrides, customOptions, ctx, finalizeOptions) {
	const config = babel.loadPartialConfig(babelOptions);

	// file is ignored by babel
	if (!config) {
		return null;
	}

	let transformOptions = !overrides.config
		? config.options
		: await overrides.config.call(this, config, {
				code,
				customOptions,
		  });

	if (finalizeOptions) {
		transformOptions = await finalizeOptions(transformOptions);
	}

	if (!overrides.result) {
		const { code, map } = await babel.transformAsync(inputCode, transformOptions);
		return {
			code,
			map,
		};
	}

	const result = await babel.transformAsync(inputCode, transformOptions);
	const { code, map } = await overrides.result.call(ctx, result, {
		code: inputCode,
		customOptions,
		config,
		transformOptions,
	});
	return {
		code,
		map,
	};
}
