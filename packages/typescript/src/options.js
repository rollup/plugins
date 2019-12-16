import { sep } from 'path';
import { existsSync, readFileSync } from 'fs';

export function getDefaultOptions() {
  return {
    noEmitHelpers: true,
    module: 'ESNext',
    sourceMap: true,
    importHelpers: true
  };
}

// Gratefully lifted from 'look-up', due to problems using it directly:
//   https://github.com/jonschlinkert/look-up/blob/master/index.js
//   MIT Licenced
function findFile(cwd, filename) {
  let fp = cwd ? `${cwd}/${filename}` : filename;

  if (existsSync(fp)) {
    return fp;
  }

  const segs = cwd.split(sep);

  for (let len = segs.length; len >= 0; len--) {
    const workingDir = segs.slice(0, len).join('/');
    fp = `${workingDir}/${filename}`;
    if (existsSync(fp)) {
      return fp;
    }
  }

  return null;
}

export function readTsConfig(typescript, tsconfigPath) {
  if (tsconfigPath && !existsSync(tsconfigPath)) {
    throw new Error(`Could not find specified tsconfig.json at ${tsconfigPath}`);
  }
  const existingTsConfig = tsconfigPath || findFile(process.cwd(), 'tsconfig.json');
  if (!existingTsConfig) {
    return {};
  }
  const tsconfig = typescript.readConfigFile(existingTsConfig, (path) =>
    readFileSync(path, 'utf8')
  );

  if (!tsconfig.config || !tsconfig.config.compilerOptions) return { compilerOptions: {} };
  return tsconfig.config;
}

export function adjustCompilerOptions(typescript, options) {
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
