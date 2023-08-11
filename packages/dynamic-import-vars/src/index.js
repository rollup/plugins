import path from 'path';

import { walk } from 'estree-walker';
import MagicString from 'magic-string';
import fastGlob from 'fast-glob';
import { generate } from 'astring';

import { createFilter } from '@rollup/pluginutils';

import { dynamicImportToGlob, VariableDynamicImportError } from './dynamic-import-to-glob';

function dynamicImportVariables({ include, exclude, warnOnError } = {}) {
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
            const result = fastGlob.sync(glob, { cwd: path.dirname(id) });
            const paths = result.map((r) =>
              r.startsWith('./') || r.startsWith('../') ? r : `./${r}`
            );

            // create magic string if it wasn't created already
            ms = ms || new MagicString(code);
            // unpack variable dynamic import into a function with import statements per file, rollup
            // will turn these into chunks automatically
            ms.prepend(
              `function __variableDynamicImportRuntime${dynamicImportIndex}__(path) {
  switch (path) {
${paths
  .map((p) => `    case '${p}': return import('${p}'${importArg ? `, ${importArg}` : ''});`)
  .join('\n')}
${`    default: return new Promise(function(resolve, reject) {
      (typeof queueMicrotask === 'function' ? queueMicrotask : setTimeout)(
        reject.bind(null, new Error("Unknown variable dynamic import: " + path))
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
export { dynamicImportToGlob, VariableDynamicImportError };
