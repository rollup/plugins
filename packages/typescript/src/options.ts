import { readFileSync } from 'fs';
import { join } from 'path';

export function getDefaultOptions() {
  return {
    noEmitHelpers: true,
    module: 'ESNext',
    sourceMap: true,
    importHelpers: true
  };
}

export function readTsConfig(ts: typeof import('typescript'), tsconfigPath: string | undefined) {
  if (tsconfigPath && !ts.sys.fileExists(tsconfigPath)) {
    throw new Error(`Could not find specified tsconfig.json at ${tsconfigPath}`);
  }
  const existingTsConfig = tsconfigPath || ts.findConfigFile(process.cwd(), ts.sys.fileExists);
  if (!existingTsConfig) {
    return {};
  }

  const tsconfig = ts.readConfigFile(existingTsConfig, (path) => readFileSync(path, 'utf8'));

  if (!tsconfig.config || !tsconfig.config.compilerOptions) return { compilerOptions: {} };

  const extendedTsConfig: string = tsconfig.config.extends;
  if (extendedTsConfig) {
    tsconfig.config.extends = join(process.cwd(),existingTsConfig, '..', extendedTsConfig );
  }

  return tsconfig.config;
}

export function adjustCompilerOptions(options: any) {
  const opts = Object.assign({}, options);
  // Set `sourceMap` to `inlineSourceMap` if it's a boolean
  // under the assumption that both are never specified simultaneously.
  if (typeof opts.inlineSourceMap === 'boolean') {
    opts.sourceMap = opts.inlineSourceMap;
    delete opts.inlineSourceMap;
  }

  // Delete some options to prevent compilation error.
  // See: https://github.com/rollup/rollup-plugin-typescript/issues/45
  // See: https://github.com/rollup/rollup-plugin-typescript/issues/142
  delete opts.declaration;
  // Delete the `declarationMap` option, as it will cause an error, because we have
  // deleted the `declaration` option.
  delete opts.declarationMap;
  delete opts.incremental;
  delete opts.tsBuildInfoFile;
  return opts;
}

export function parseCompilerOptions(ts: typeof import('typescript'), tsConfig: any) {
  const parsed = ts.convertCompilerOptionsFromJson(tsConfig.compilerOptions, process.cwd());

  // let typescript load inheritance chain if there are base configs
  const extendedConfig = tsConfig.extends
    ? ts.parseJsonConfigFileContent(tsConfig, ts.sys, process.cwd(), parsed.options)
    : null;

  return {
    options: extendedConfig?.options || parsed.options,
    errors: parsed.errors.concat(extendedConfig?.errors || [])
  };
}

/**
 * Verify that we're targeting ES2015 modules.
 * @param moduleType `tsConfig.compilerOptions.module`
 */
export function validateModuleType(moduleType: string) {
  const esModuleTypes = new Set(['ES2015', 'ES6', 'ESNEXT', 'COMMONJS']);

  if (!esModuleTypes.has(moduleType.toUpperCase())) {
    throw new Error(
      `@rollup/plugin-typescript: The module kind should be 'ES2015' or 'ESNext, found: '${moduleType}'`
    );
  }
}
