export const CJSyntaxRe = /__filename|__dirname|require\(|require\.resolve\(/;

export const CJSShim = `
// -- CommonJS Shims --
import cjsUrl from 'url';
import cjsPath from 'path';
import cjsMod from 'module';
const __filename = cjsUrl.fileURLToPath(import.meta.url);
const __dirname = cjsPath.dirname(__filename);
const require = cjsMod.createRequire(import.meta.url);
`;

export const ESM_STATIC_IMPORT_RE =
  /(?<=\s|^|;)import\s*([\s"']*(?<imports>[\w\t\n\r $*,/{}]+)from\s*)?["']\s*(?<specifier>(?<="\s*)[^"]*[^\s"](?=\s*")|(?<='\s*)[^']*[^\s'](?=\s*'))\s*["'][\s;]*/gm;
