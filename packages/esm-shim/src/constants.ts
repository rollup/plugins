export const CJSyntaxRegex = /__filename|__dirname|require\(|require\.resolve\(/;

export const ESMShim = `
// -- Shims --
import cjsUrl from 'node:url';
import cjsPath from 'node:path';
import cjsModule from 'node:module';
const __filename = cjsUrl.fileURLToPath(import.meta.url);
const __dirname = cjsPath.dirname(__filename);
const require = cjsModule.createRequire(import.meta.url);
`;

export const ESMStaticImportRegex =
  /(?<=\s|^|;)import\s*([\s"']*(?<imports>[\w\t\n\r $*,/{}]+)from\s*)?["']\s*(?<specifier>(?<="\s*)[^"\n]*[^\s"](?=\s*")|(?<='\s*)[^'\n]*[^\s'](?=\s*'))\s*["'][\s;]*/gm;
