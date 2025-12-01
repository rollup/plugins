import path from 'path';

import { createRequire } from 'module';

import type { Assertions } from 'ava';

/**
 * NOTE: Generics let each plugin supply its own Rollup types. Some helpers cast
 * literals to `TOpt`; ideally we shouldn't construct unknown types, but this
 * preserves earlier behavior.
 */

interface OutLike {
  fileName: string;
  code?: string;
  source?: string | Uint8Array;
  map?: unknown;
  imports?: string[];
  modules?: Record<string, unknown>;
}

interface BundleLike<TOpts, TOut extends OutLike = OutLike> {
  imports?: string[];
  generate(options?: TOpts): Promise<{ output: TOut[] }>;
}

export async function getCodeOutputs<TOpt, TOut extends OutLike>(
  bundle: BundleLike<TOpt, TOut>,
  outputOptions?: TOpt
): Promise<TOut[]> {
  const { output } = await bundle.generate(
    outputOptions ?? ({ format: 'cjs', exports: 'auto' } as TOpt)
  );
  return output;
}

export async function getCode<TOpt, TOut extends OutLike>(
  bundle: BundleLike<TOpt, TOut>,
  outputOptions?: TOpt,
  allFiles?: false
): Promise<string>;
export async function getCode<TOpt, TOut extends OutLike>(
  bundle: BundleLike<TOpt, TOut>,
  outputOptions: TOpt | undefined,
  allFiles: true
): Promise<{ fileName: string; code?: string; source?: string | Uint8Array; map?: unknown }[]>;
export async function getCode<TOpt, TOut extends OutLike>(
  bundle: BundleLike<TOpt, TOut>,
  outputOptions?: TOpt,
  allFiles = false
): Promise<
  string | { fileName: string; code?: string; source?: string | Uint8Array; map?: unknown }[]
> {
  const output = await getCodeOutputs<TOpt, TOut>(bundle, outputOptions);

  if (allFiles) {
    return output.map(({ code, fileName, source, map }) => {
      return {
        code,
        fileName,
        source,
        map
      };
    });
  }
  const [{ code }] = output;
  return code ?? '';
}

export async function getFiles<TOpt extends { dir?: string; file?: string }>(
  bundle: BundleLike<TOpt>,
  options?: TOpt
): Promise<{ fileName: string; content?: string | Uint8Array }[]> {
  const { dir, file } = options ?? {};
  const baseDir = dir || (file ? path.dirname(file) : null);
  if (!baseDir) throw new Error('You must specify "output.file" or "output.dir" for the build.');

  const { output } = await bundle.generate(options);

  return output.map(({ code, fileName, source }) => {
    const absPath = path.resolve(baseDir, fileName);
    return {
      fileName: path.relative(process.cwd(), absPath).split(path.sep).join('/'),
      content: code || source
    };
  });
}

export async function getImports<TOpt>(bundle: BundleLike<TOpt>): Promise<string[]> {
  if (bundle.imports) {
    return bundle.imports;
  }
  const { output } = await bundle.generate({ format: 'es' } as TOpt);
  const [{ imports }] = output;
  return imports ?? [];
}

export async function getResolvedModules<TOpt, TOut extends OutLike>(
  bundle: BundleLike<TOpt, TOut>
): Promise<NonNullable<TOut['modules']>> {
  const {
    output: [{ modules }]
  } = await bundle.generate({ format: 'es' } as TOpt);
  return (modules ?? {}) as NonNullable<TOut['modules']>;
}

export function onwarn(warning: unknown): void {
  // eslint-disable-next-line no-console
  console.warn(String(warning));
}

export async function testBundle<TOpt>(
  t: Assertions | null,
  bundle: BundleLike<TOpt>,
  {
    inject = {},
    options = {} as TOpt
  }: {
    inject?: Record<string, any>;
    options?: TOpt;
  } = {}
): Promise<{
  code: string;
  error?: any;
  result?: any;
  module: Pick<NodeJS.Module, 'exports'>;
}> {
  const { output } = await bundle.generate({ format: 'cjs', exports: 'auto', ...options });
  const code = output[0]?.code ?? '';
  const module: Pick<NodeJS.Module, 'exports'> = { exports: {} };
  // as of 1/2/2020 Github Actions + Windows has changed in a way that we must now escape backslashes
  const cwd = process.cwd().replace(/\\/g, '\\\\');
  const params = ['module', 'exports', 'require', 't', ...Object.keys(inject)].concat(
    `process.chdir('${cwd}'); let result;\n\n${code}\n\nreturn result;`
  );

  // eslint-disable-next-line no-new-func
  const func = new Function(...params);
  let error;
  let result;

  try {
    // In ESM, there is no global `require`. We just need *a* require function;
    const requireFn =
      typeof require === 'function' ? require : createRequire('file:///test-helper.js');
    result = func(...[module, module.exports, requireFn, t, ...Object.values(inject)]);
  } catch (e) {
    error = e;
  }

  return { code, error, module, result };
}

export async function evaluateBundle<TOpt>(
  bundle: BundleLike<TOpt>
): Promise<NodeJS.Module['exports']> {
  const { module } = await testBundle(null, bundle);
  return module.exports;
}
