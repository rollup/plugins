/* eslint-disable no-param-reassign */
import { walk } from 'estree-walker';
import MagicString from 'magic-string';
import { createFilter } from '@rollup/pluginutils';

const whitespace = /\s/;

function getName(node) {
  if (node.type === 'Identifier') return node.name;
  if (node.type === 'ThisExpression') return 'this';
  if (node.type === 'Super') return 'super';

  return null;
}

function flatten(node) {
  const parts = [];

  while (node.type === 'MemberExpression') {
    if (node.computed) return null;

    parts.unshift(node.property.name);
    node = node.object;
  }

  const name = getName(node);

  if (!name) return null;

  parts.unshift(name);
  return parts.join('.');
}

export default function strip(options = {}) {
  const include = options.include || '**/*.js';
  const { exclude } = options;
  const filter = createFilter(include, exclude);
  const sourceMap = options.sourceMap !== false;

  const removeDebuggerStatements = options.debugger !== false;
  const functions = (options.functions || ['console.*', 'assert.*']).map((keypath) =>
    keypath.replace(/\*/g, '\\w+').replace(/\./g, '\\s*\\.\\s*')
  );

  const labels = options.labels || [];

  const labelsPatterns = labels.map((l) => `${l}\\s*:`);

  const firstPass = [...functions, ...labelsPatterns];
  if (removeDebuggerStatements) {
    firstPass.push('debugger\\b');
  }

  const reFunctions = new RegExp(`^(?:${functions.join('|')})$`);
  const reFirstpass = new RegExp(`\\b(?:${firstPass.join('|')})`);
  const firstPassFilter = firstPass.length > 0 ? (code) => reFirstpass.test(code) : () => false;
  const UNCHANGED = null;

  return {
    name: 'strip',

    transform(code, id) {
      if (!filter(id) || !firstPassFilter(code)) {
        return UNCHANGED;
      }

      let ast;

      try {
        ast = this.parse(code);
      } catch (err) {
        err.message += ` in ${id}`;
        throw err;
      }

      const magicString = new MagicString(code);
      let edited = false;

      function remove(start, end) {
        while (whitespace.test(code[start - 1])) start -= 1;
        magicString.remove(start, end);
      }

      function isBlock(node) {
        return node && (node.type === 'BlockStatement' || node.type === 'Program');
      }

      function removeExpression(node) {
        const { parent } = node;

        if (parent.type === 'ExpressionStatement') {
          removeStatement(parent);
        } else {
          magicString.overwrite(node.start, node.end, '(void 0)');
        }

        edited = true;
      }

      function removeStatement(node) {
        const { parent } = node;

        if (isBlock(parent)) {
          remove(node.start, node.end);
        } else {
          magicString.overwrite(node.start, node.end, '(void 0);');
        }

        edited = true;
      }

      walk(ast, {
        enter(node, parent) {
          Object.defineProperty(node, 'parent', {
            value: parent,
            enumerable: false,
            configurable: true
          });

          if (sourceMap) {
            magicString.addSourcemapLocation(node.start);
            magicString.addSourcemapLocation(node.end);
          }

          if (removeDebuggerStatements && node.type === 'DebuggerStatement') {
            removeStatement(node);
            this.skip();
          } else if (node.type === 'LabeledStatement') {
            if (node.label && labels.includes(node.label.name)) {
              removeStatement(node);
              this.skip();
            }
          } else if (node.type === 'CallExpression') {
            const keypath = flatten(node.callee);
            if (keypath && reFunctions.test(keypath)) {
              removeExpression(node);
              this.skip();
            }
          }
        }
      });

      if (!edited) {
        return UNCHANGED;
      }

      code = magicString.toString();
      const map = sourceMap ? magicString.generateMap() : null;

      return { code, map };
    }
  };
}
