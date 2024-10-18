import path from 'path';

import { walk } from 'estree-walker';
import MagicString from 'magic-string';
import { globSync } from 'tinyglobby';
import { generate } from 'astring';

import { createFilter } from '@rollup/pluginutils';

import {
  dynamicImportToGlob,
  VariableDynamicImportError,
  normalizePath
} from './dynamic-import-to-glob';

const normalizePathString = normalizePath.toString().replace(/\n/g, '\n  ');

function dynamicImportVariables({ include, exclude, warnOnError, errorWhenNoFilesFound } = {}) {
  const filter = createFilter(include, exclude);

  return {
    name: 'rollup-plugin-dynamic-import-variables',

    transform(code, id) {
      if (!filter(id)) {
        return null;
      }

      const parsed = this.parse(code);

      let dynamicImportIndex = -1;
      let ms;

      walk(parsed, {
        enter: (node) => {
          if (node.type !== 'ImportExpression') {
            return;
          }
          dynamicImportIndex += 1;

          let importArg;
          if (node.arguments && node.arguments.length > 0) {
            // stringify the argument node, without indents, removing newlines and using single quote strings
            importArg = generate(node.arguments[0], { indent: '' })
              .replace(/\n/g, '')
              .replace(/"/g, "'");
          }

          try {
            // see if this is a variable dynamic import, and generate a glob expression
            const glob = dynamicImportToGlob(node.source, code.substring(node.start, node.end));

            if (!glob) {
              // this was not a variable dynamic import
              return;
            }

            // execute the glob
            const result = globSync(glob, { cwd: path.dirname(id), expandDirectories: false });
            const paths = result.map((r) =>
              r.startsWith('./') || r.startsWith('../') ? r : `./${r}`
            );

            if (errorWhenNoFilesFound && paths.length === 0) {
              const error = new Error(
                `No files found in ${glob} when trying to dynamically load concatted string from ${id}`
              );
              if (warnOnError) {
                this.warn(error);
              } else {
                this.error(error);
              }
            }

            // create magic string if it wasn't created already
            ms = ms || new MagicString(code);
            // unpack variable dynamic import into a function with import statements per file, rollup
            // will turn these into chunks automatically
            ms.prepend(
              `function __variableDynamicImportRuntime${dynamicImportIndex}__(path) {
  path = (${normalizePathString})(path);
  switch (normalPath) {
${paths
  .map((p) => `    case '${p}': return import('${p}'${importArg ? `, ${importArg}` : ''});`)
  .join('\n')}
${`    default: return new Promise(function(resolve, reject) {
      (typeof queueMicrotask === 'function' ? queueMicrotask : setTimeout)(
        reject.bind(null, new Error("Unknown variable dynamic import: " + normalPath))
      );
    })\n`}   }
 }\n\n`
            );

            // call the runtime function instead of doing a dynamic import, the import specifier will
            // be evaluated at runtime and the correct import will be returned by the injected function
            ms.overwrite(
              node.start,
              node.start + 6,
              `__variableDynamicImportRuntime${dynamicImportIndex}__`
            );
          } catch (error) {
            if (error instanceof VariableDynamicImportError) {
              // TODO: line number
              if (warnOnError) {
                this.warn(error);
              } else {
                this.error(error);
              }
            } else {
              this.error(error);
            }
          }
        }
      });

      if (ms && dynamicImportIndex !== -1) {
        return {
          code: ms.toString(),
          map: ms.generateMap({
            file: id,
            includeContent: true,
            hires: true
          })
        };
      }
      return null;
    }
  };
}

export default dynamicImportVariables;
export { dynamicImportToGlob, VariableDynamicImportError, normalizePath };
