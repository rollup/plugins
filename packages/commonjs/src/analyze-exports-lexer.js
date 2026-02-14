import { init, parse } from 'cjs-module-lexer';

let initialized = false;

/**
 * Ensure cjs-module-lexer WASM is initialized.
 * Safe to call multiple times — will only init once.
 */
export async function ensureInit() {
  if (!initialized) {
    await init();
    initialized = true;
  }
}

/**
 * Analyze a CommonJS module source to detect named exports.
 *
 * @param {string} code — The raw CJS source code.
 * @param {string} id — The module ID (for error reporting).
 * @returns {Promise<{
 *   exports: string[]
 *   reexports: string[]
 *   hasDefaultExport: boolean
 * }>}
 */
export async function analyzeExports(code, id) {
  await ensureInit();
  try {
    const result = parse(code);
    // Deduplicate and filter out "default" — handled separately
    const namedExports = [...new Set(result.exports)].filter(e => e !== 'default');
    const reexports = [...new Set(result.reexports)];
    return {
      exports: namedExports,
      reexports,
      hasDefaultExport: result.exports.includes('default'),
    };
  } catch (err) {
    // If lexer fails (e.g. WASM issue), fall back gracefully
    console.warn(
      `[commonjs] cjs-module-lexer failed for ${id}: ${err.message}. ` +
        'Falling back to no named exports.'
    );

    return { exports: [], reexports: [], hasDefaultExport: true };
  }
}

/**
 * Given a list of reexport sources, recursively resolve
 * their named exports using the provided resolver.
 *
 * @param {string[]} reexportSources
 * @param {(source: string) => Promise<string|null>} resolve
 * @param {(id: string) => Promise<string>} loadCode
 * @param {Set<string>} [seen]
 * @returns {Promise<string[]>}
 */
export async function resolveReexports(reexportSources, resolve, loadCode, seen = new Set()) {
  const allExports = [];
  for (const source of reexportSources) {
    const resolved = await resolve(source);
    if (!resolved || seen.has(resolved)) continue;
    seen.add(resolved);
    try {
      const code = await loadCode(resolved);
      const { exports: childExports, reexports: childReexports } = await analyzeExports(code, resolved);
      allExports.push(...childExports);
      if (childReexports.length > 0) {
        const nested = await resolveReexports(childReexports, resolve, loadCode, seen);
        allExports.push(...nested);
      }
    } catch {
      // skip unresolvable reexports
    }
  }

  return [...new Set(allExports)];
}
