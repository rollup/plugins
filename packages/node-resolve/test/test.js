const fs = require('fs');
const path = require('path');

const test = require('ava');
const rollup = require('rollup');
const commonjs = require('rollup-plugin-commonjs');
const babel = require('rollup-plugin-babel');

const { testBundle } = require('../../../util/test');

const nodeResolve = require('..');

process.chdir(__dirname);

function expectWarnings(warnings) {
  let warningIndex = 0;
  return (warning) => {
    if (warningIndex >= warnings.length) {
      throw new Error(`Unexpected warning: "${warning.message}"`);
    } else {
      const expectedWarning = warnings[warningIndex];
      for (const key of Object.keys(expectedWarning)) {
        t.is(warning[key], expectedWarning[key]);
      }
    }
    warningIndex += 1;
  };
}

const expectNoWarnings = expectWarnings([]);

function getBundleImports(bundle) {
  return bundle.imports
    ? Promise.resolve(bundle.imports)
    : bundle.generate({ format: 'esm' }).then((generated) => generated.output[0].imports);
}

test('finds a module with jsnext:main', async (t) =>
  rollup
    .rollup({
      input: 'samples/jsnext/main.js',
      onwarn: expectNoWarnings,
      plugins: [nodeResolve({ mainFields: ['jsnext:main', 'module', 'main'] })]
    })
    .then(executeBundle)
    .then((module) => {
      t.is(module.exports, 'JSNEXT');
    }));

// test('DEPRECATED: options.jsnext still works with correct priority', async (t) =>
//   rollup
//     .rollup({
//       input: 'samples/jsnext/main.js',
//       plugins: [nodeResolve({ jsnext: true, main: true })]
//     })
//     .then(executeBundle)
//     .then((module) => {
//       t.is(module.exports, 'JSNEXT');
//     }));
//
// test('DEPRECATED: options.module still works with correct priority', async (t) =>
//   rollup
//     .rollup({
//       input: 'samples/module/main.js',
//       plugins: [nodeResolve({ module: true, main: true, preferBuiltins: false })]
//     })
//     .then(executeBundle)
//     .then((module) => {
//       t.is(module.exports, 'MODULE');
//     }));
//
// test('finds and converts a basic CommonJS module', async (t) =>
//   rollup
//     .rollup({
//       input: 'samples/commonjs/main.js',
//       onwarn: expectNoWarnings,
//       plugins: [nodeResolve({ mainFields: ['main'] }), commonjs()]
//     })
//     .then(executeBundle)
//     .then((module) => {
//       t.is(module.exports, 'It works!');
//     }));
//
// test('handles a trailing slash', async (t) =>
//   rollup
//     .rollup({
//       input: 'samples/trailing-slash/main.js',
//       onwarn: expectNoWarnings,
//       plugins: [nodeResolve({ mainFields: ['main'] }), commonjs()]
//     })
//     .then(executeBundle)
//     .then((module) => {
//       t.is(module.exports, 'It works!');
//     }));
//
// test('finds a file inside a package directory', async (t) =>
//   rollup
//     .rollup({
//       input: 'samples/granular/main.js',
//       onwarn: expectNoWarnings,
//       plugins: [
//         nodeResolve(),
//         babel({
//           presets: [
//             [
//               '@babel/preset-env',
//               {
//                 targets: {
//                   node: 6
//                 }
//               }
//             ]
//           ]
//         })
//       ]
//     })
//     .then(executeBundle)
//     .then((module) => {
//       t.is(module.exports, 'FOO');
//     }));
//
// test('loads local directories by finding index.js within them', async (t) =>
//   rollup
//     .rollup({
//       input: 'samples/local-index/main.js',
//       onwarn: expectNoWarnings,
//       plugins: [nodeResolve()]
//     })
//     .then(executeBundle)
//     .then((module) => {
//       t.is(module.exports, 42);
//     }));
//
// test('loads package directories by finding index.js within them', async (t) =>
//   rollup
//     .rollup({
//       input: 'samples/package-index/main.js',
//       onwarn: expectNoWarnings,
//       plugins: [nodeResolve()]
//     })
//     .then((bundle) =>
//       bundle.generate({
//         format: 'cjs'
//       })
//     )
//     .then((generated) => {
//       t.truthy(~generated.output[0].code.indexOf('setPrototypeOf'));
//     }));
//
// test('disregards top-level browser field', async (t) =>
//   rollup
//     .rollup({
//       input: 'samples/browser/main.js',
//       onwarn: expectNoWarnings,
//       plugins: [nodeResolve()]
//     })
//     .then(executeBundle)
//     .then((module) => {
//       t.is(module.exports, 'node');
//     }));
//
// test('allows use of the top-level browser field', async (t) =>
//   rollup
//     .rollup({
//       input: 'samples/browser/main.js',
//       onwarn: expectNoWarnings,
//       plugins: [
//         nodeResolve({
//           mainFields: ['browser', 'main']
//         })
//       ]
//     })
//     .then(executeBundle)
//     .then((module) => {
//       t.is(module.exports, 'browser');
//     }));
//
// test('disregards object browser field', async (t) =>
//   rollup
//     .rollup({
//       input: 'samples/browser-object/main.js',
//       onwarn: expectNoWarnings,
//       plugins: [nodeResolve()]
//     })
//     .then(executeBundle)
//     .then((module) => {
//       t.is(module.exports.env, 'node');
//       t.is(module.exports.dep, 'node-dep');
//       t.is(module.exports.test, 42);
//     }));
//
// test('allows use of the object browser field', async (t) =>
//   rollup
//     .rollup({
//       input: 'samples/browser-object/main.js',
//       onwarn: expectNoWarnings,
//       plugins: [
//         nodeResolve({
//           mainFields: ['browser', 'main']
//         })
//       ]
//     })
//     .then(executeBundle)
//     .then((module) => {
//       t.is(module.exports.env, 'browser');
//       t.is(module.exports.dep, 'browser-dep');
//       t.is(module.exports.test, 43);
//     }));
//
// test('allows use of object browser field, resolving `main`', async (t) =>
//   rollup
//     .rollup({
//       input: 'samples/browser-object-main/main.js',
//       onwarn: expectNoWarnings,
//       plugins: [
//         nodeResolve({
//           mainFields: ['browser', 'main']
//         })
//       ]
//     })
//     .then(executeBundle)
//     .then((module) => {
//       t.is(module.exports.env, 'browser');
//       t.is(module.exports.dep, 'browser-dep');
//       t.is(module.exports.test, 43);
//     }));
//
// test('options.browser = true still works', async (t) =>
//   rollup
//     .rollup({
//       input: 'samples/browser-object-main/main.js',
//       plugins: [
//         nodeResolve({
//           browser: true
//         })
//       ]
//     })
//     .then(executeBundle)
//     .then((module) => {
//       t.is(module.exports.env, 'browser');
//       t.is(module.exports.dep, 'browser-dep');
//       t.is(module.exports.test, 43);
//     }));
//
// test('allows use of object browser field, resolving implicit `main`', async (t) =>
//   rollup
//     .rollup({
//       input: 'samples/browser-object/main-implicit.js',
//       onwarn: expectNoWarnings,
//       plugins: [
//         nodeResolve({
//           mainFields: ['browser', 'main']
//         })
//       ]
//     })
//     .then(executeBundle)
//     .then((module) => {
//       t.is(module.exports.env, 'browser');
//     }));
//
// test('allows use of object browser field, resolving replaced builtins', async (t) =>
//   rollup
//     .rollup({
//       input: 'samples/browser-object-builtin/main.js',
//       onwarn: expectNoWarnings,
//       plugins: [
//         nodeResolve({
//           mainFields: ['browser', 'main']
//         })
//       ]
//     })
//     .then(executeBundle)
//     .then((module) => {
//       t.is(module.exports, 'browser-fs');
//     }));
//
// test('allows use of object browser field, resolving nested directories', async (t) =>
//   rollup
//     .rollup({
//       input: 'samples/browser-object-nested/main.js',
//       onwarn: expectNoWarnings,
//       plugins: [
//         nodeResolve({
//           mainFields: ['browser', 'main']
//         })
//       ]
//     })
//     .then(executeBundle)
//     .then((module) => {
//       t.is(module.exports.env, 'browser');
//       t.is(module.exports.dep, 'browser-dep');
//       t.is(module.exports.test, 43);
//     }));
//
// test('allows use of object browser field, resolving `main`', async (t) =>
//   rollup
//     .rollup({
//       input: 'samples/browser-object-main/main.js',
//       onwarn: expectNoWarnings,
//       plugins: [
//         nodeResolve({
//           mainFields: ['browser', 'main']
//         })
//       ]
//     })
//     .then(executeBundle)
//     .then((module) => {
//       t.is(module.exports.env, 'browser');
//       t.is(module.exports.dep, 'browser-dep');
//       t.is(module.exports.test, 43);
//     }));
//
// test('allows use of object browser field, resolving implicit `main`', async (t) =>
//   rollup
//     .rollup({
//       input: 'samples/browser-object/main-implicit.js',
//       onwarn: expectNoWarnings,
//       plugins: [
//         nodeResolve({
//           mainFields: ['browser', 'main']
//         })
//       ]
//     })
//     .then(executeBundle)
//     .then((module) => {
//       t.is(module.exports.env, 'browser');
//     }));
//
// test('allows use of object browser field, resolving replaced builtins', async (t) =>
//   rollup
//     .rollup({
//       input: 'samples/browser-object-builtin/main.js',
//       onwarn: expectNoWarnings,
//       plugins: [
//         nodeResolve({
//           mainFields: ['browser', 'main']
//         })
//       ]
//     })
//     .then(executeBundle)
//     .then((module) => {
//       t.is(module.exports, 'browser-fs');
//     }));
//
// test('respects local browser field', async (t) =>
//   rollup
//     .rollup({
//       input: 'samples/browser-local/main.js',
//       onwarn: expectNoWarnings,
//       plugins: [
//         nodeResolve({
//           mainFields: ['browser', 'main']
//         })
//       ]
//     })
//     .then(executeBundle)
//     .then((module) => {
//       t.is(module.exports, 'component-type');
//     }));
//
// test('warns when importing builtins', async (t) =>
//   rollup
//     .rollup({
//       input: 'samples/builtins/main.js',
//       onwarn: expectWarnings([
//         {
//           code: 'UNRESOLVED_IMPORT',
//           source: 'path'
//         }
//       ]),
//       plugins: [
//         nodeResolve({
//           mainFields: ['browser', 'main'],
//           preferBuiltins: true
//         })
//       ]
//     })
//     .then(executeBundle)
//     .then((module) => {
//       t.is(module.exports, require('path').sep);
//     }));
//
// test('allows use of object browser field, resolving nested directories', async (t) =>
//   rollup
//     .rollup({
//       input: 'samples/browser-object-nested/main.js',
//       onwarn: expectNoWarnings,
//       plugins: [
//         nodeResolve({
//           mainFields: ['browser', 'main']
//         })
//       ]
//     })
//     .then(executeBundle)
//     .then((module) => {
//       t.is(module.exports.env, 'browser');
//       t.is(module.exports.dep, 'browser-dep');
//       t.is(module.exports.test, 43);
//     }));
//
// test('allows use of object browser field, resolving `main`', async (t) =>
//   rollup
//     .rollup({
//       input: 'samples/browser-object-main/main.js',
//       onwarn: expectNoWarnings,
//       plugins: [
//         nodeResolve({
//           mainFields: ['browser', 'main']
//         })
//       ]
//     })
//     .then(executeBundle)
//     .then((module) => {
//       t.is(module.exports.env, 'browser');
//       t.is(module.exports.dep, 'browser-dep');
//       t.is(module.exports.test, 43);
//     }));
//
// test('allows use of object browser field, resolving implicit `main`', async (t) =>
//   rollup
//     .rollup({
//       input: 'samples/browser-object/main-implicit.js',
//       onwarn: expectNoWarnings,
//       plugins: [
//         nodeResolve({
//           mainFields: ['browser', 'main']
//         })
//       ]
//     })
//     .then(executeBundle)
//     .then((module) => {
//       t.is(module.exports.env, 'browser');
//     }));
//
// test('allows use of object browser field, resolving replaced builtins', async (t) =>
//   rollup
//     .rollup({
//       input: 'samples/browser-object-builtin/main.js',
//       onwarn: expectNoWarnings,
//       plugins: [
//         nodeResolve({
//           mainFields: ['browser', 'main']
//         })
//       ]
//     })
//     .then(executeBundle)
//     .then((module) => {
//       t.is(module.exports, 'browser-fs');
//     }));
//
// test('allows use of object browser field, resolving nested directories', async (t) =>
//   rollup
//     .rollup({
//       input: 'samples/browser-object-nested/main.js',
//       onwarn: expectNoWarnings,
//       plugins: [
//         nodeResolve({
//           mainFields: ['browser', 'main']
//         })
//       ]
//     })
//     .then(executeBundle)
//     .then((module) => {
//       t.is(module.exports.env, 'browser');
//       t.is(module.exports.dep, 'browser-dep');
//       t.is(module.exports.test, 43);
//     }));
//
// test('allows use of object browser field, resolving to nested node_modules', async (t) =>
//   rollup
//     .rollup({
//       input: 'samples/browser-entry-points-to-node-module/index.js',
//       onwarn: expectNoWarnings,
//       plugins: [
//         nodeResolve({
//           main: true,
//           browser: true
//         })
//       ]
//     })
//     .then(executeBundle)
//     .then((module) => {
//       t.is(module.exports, 'component-type');
//     }));
//
// test('supports `false` in browser field', async (t) =>
//   rollup
//     .rollup({
//       input: 'samples/browser-false/main.js',
//       onwarn: expectNoWarnings,
//       plugins: [
//         nodeResolve({
//           mainFields: ['browser', 'main']
//         })
//       ]
//     })
//     .then(executeBundle));
//
// test('preferBuiltins: true allows preferring a builtin to a local module of the same name', async (t) =>
//   rollup
//     .rollup({
//       input: 'samples/prefer-builtin/main.js',
//       onwarn: expectWarnings([
//         {
//           code: 'UNRESOLVED_IMPORT',
//           source: 'events'
//         }
//       ]),
//       plugins: [
//         nodeResolve({
//           preferBuiltins: true
//         })
//       ]
//     })
//     .then(getBundleImports)
//     .then((imports) => t.deepEqual(imports, ['events'])));
//
// test('preferBuiltins: false allows resolving a local module with the same name as a builtin module', async (t) =>
//   rollup
//     .rollup({
//       input: 'samples/prefer-builtin/main.js',
//       onwarn: expectWarnings([
//         {
//           code: 'EMPTY_BUNDLE'
//         }
//       ]),
//       plugins: [
//         nodeResolve({
//           preferBuiltins: false
//         })
//       ]
//     })
//     .then(getBundleImports)
//     .then((imports) => t.deepEqual(imports, [])));
//
// test('issues a warning when preferring a builtin module without having explicit configuration', async (t) => {
//   let warning = null;
//   return rollup
//     .rollup({
//       input: 'samples/prefer-builtin/main.js',
//       onwarn({ message }) {
//         if (~message.indexOf('preferring')) {
//           warning = message;
//         }
//       },
//       plugins: [nodeResolve()]
//     })
//     .then(() => {
//       const localPath = path.join(__dirname, 'node_modules/events/index.js');
//       t.is(
//         warning,
//         `preferring built-in module 'events' over local alternative ` +
//           `at '${localPath}', pass 'preferBuiltins: false' to disable this behavior ` +
//           `or 'preferBuiltins: true' to disable this warning`
//       );
//     });
// });
//
// test('supports non-standard extensions', async (t) =>
//   rollup
//     .rollup({
//       input: 'samples/extensions/main.js',
//       onwarn: expectNoWarnings,
//       plugins: [
//         nodeResolve({
//           extensions: ['.js', '.wut']
//         })
//       ]
//     })
//     .then(executeBundle));
//
// test('ignores IDs with null character', async (t) =>
//   Promise.resolve(nodeResolve().resolveId('\0someid', 'test.js')).then((result) => {
//     t.is(result, null);
//   }));
//
// test('finds a module with module field', async (t) =>
//   rollup
//     .rollup({
//       input: 'samples/module/main.js',
//       onwarn: expectNoWarnings,
//       plugins: [nodeResolve({ preferBuiltins: false })]
//     })
//     .then(executeBundle)
//     .then((module) => {
//       t.is(module.exports, 'MODULE');
//     }));
//
// test('respects order if given module,jsnext:main,main', async (t) =>
//   rollup
//     .rollup({
//       input: 'samples/prefer-module/main.js',
//       onwarn: expectNoWarnings,
//       plugins: [
//         nodeResolve({ mainFields: ['module', 'jsnext:main', 'main'], preferBuiltins: false })
//       ]
//     })
//     .then(executeBundle)
//     .then((module) => {
//       t.is(module.exports, 'MODULE-ENTRY');
//     }));
//
// test('finds and uses an .mjs module', async (t) =>
//   rollup
//     .rollup({
//       input: 'samples/module-mjs/main.js',
//       onwarn: expectNoWarnings,
//       plugins: [nodeResolve({ preferBuiltins: false })]
//     })
//     .then(executeBundle)
//     .then((module) => {
//       t.is(module.exports, 'MODULE-MJS');
//     }));
//
// test('finds and uses a dual-distributed .js & .mjs module', async (t) =>
//   rollup
//     .rollup({
//       input: 'samples/dual-cjs-mjs/main.js',
//       onwarn: expectNoWarnings,
//       plugins: [nodeResolve({ preferBuiltins: false })]
//     })
//     .then(executeBundle)
//     .then((module) => {
//       t.is(module.exports, 'DUAL-MJS');
//     }));
//
// test('keeps the order of [browser, module, jsnext, main] with all enabled', async (t) =>
//   rollup
//     .rollup({
//       input: 'samples/browser/main.js',
//       plugins: [nodeResolve({ main: true, browser: true, jsnext: true, module: true })]
//     })
//     .then(executeBundle)
//     .then((module) => {
//       t.is(module.exports, 'browser');
//     }));
//
// test('should support disabling "module" field resolution', async (t) =>
//   rollup
//     .rollup({
//       input: 'samples/prefer-main/main.js',
//       plugins: [nodeResolve({ module: false })]
//     })
//     .then(executeBundle)
//     .then((module) => {
//       t.is(module.exports, 'MAIN-ENTRY');
//     }));
//
// test('should support disabling "main" field resolution', async (t) =>
//   rollup
//     .rollup({
//       input: 'samples/prefer-module/main.js',
//       plugins: [nodeResolve({ main: false })]
//     })
//     .then(executeBundle)
//     .then((module) => {
//       t.is(module.exports, 'MODULE-ENTRY');
//     }));
//
// test('should support enabling "jsnext" field resolution', async (t) =>
//   rollup
//     .rollup({
//       input: 'samples/prefer-module/main.js',
//       plugins: [nodeResolve({ main: false, module: false, jsnext: true })]
//     })
//     .then(executeBundle)
//     .then((module) => {
//       t.is(module.exports, 'JSNEXT-ENTRY');
//     }));
//
// describe('symlinks', async (t) => {
//   function createMissingDirectories() {
//     createDirectory('./samples/symlinked/first/node_modules');
//     createDirectory('./samples/symlinked/second/node_modules');
//     createDirectory('./samples/symlinked/third/node_modules');
//   }
//
//   function createDirectory(pathToDir) {
//     if (!fs.existsSync(pathToDir)) {
//       fs.mkdirSync(pathToDir);
//     }
//   }
//
//   function linkDirectories() {
//     fs.symlinkSync('../../second', './samples/symlinked/first/node_modules/second', 'dir');
//     fs.symlinkSync('../../third', './samples/symlinked/first/node_modules/third', 'dir');
//     fs.symlinkSync('../../third', './samples/symlinked/second/node_modules/third', 'dir');
//   }
//
//   function unlinkDirectories() {
//     fs.unlinkSync('./samples/symlinked/first/node_modules/second');
//     fs.unlinkSync('./samples/symlinked/first/node_modules/third');
//     fs.unlinkSync('./samples/symlinked/second/node_modules/third');
//   }
//
//   beforeEach(() => {
//     createMissingDirectories();
//     linkDirectories();
//   });
//
//   afterEach(() => {
//     unlinkDirectories();
//   });
//
//   test('resolves symlinked packages', async (t) =>
//     rollup
//       .rollup({
//         input: 'samples/symlinked/first/index.js',
//         onwarn: expectNoWarnings,
//         plugins: [nodeResolve()]
//       })
//       .then(executeBundle)
//       .then((module) => {
//         t.is(module.exports.number1, module.exports.number2);
//       }));
//
//   test('preserves symlinks if `preserveSymlinks` is true', async (t) =>
//     rollup
//       .rollup({
//         input: 'samples/symlinked/first/index.js',
//         onwarn: expectNoWarnings,
//         plugins: [nodeResolve()],
//         preserveSymlinks: true
//       })
//       .then(executeBundle)
//       .then((module) => {
//         t.not(module.exports.number1, module.exports.number2);
//       }));
// });
//
// test('respects order if given jsnext:main, main', async (t) =>
//   rollup
//     .rollup({
//       input: 'samples/prefer-jsnext/main.js',
//       onwarn: expectNoWarnings,
//       plugins: [nodeResolve({ mainFields: ['jsnext:main', 'main'], preferBuiltins: false })]
//     })
//     .then(executeBundle)
//     .then((module) => {
//       t.is(module.exports, 'JSNEXT-ENTRY');
//     }));
//
// test('supports ./ in entry filename', async (t) =>
//   rollup
//     .rollup({
//       input: './samples/jsnext/main.js',
//       onwarn: expectNoWarnings,
//       plugins: [nodeResolve({})]
//     })
//     .then(executeBundle)
//     .then((module) => {
//       t.is(module.exports, 'MAIN');
//     }));
//
// test('throws error if local id is not resolved', async (t) => {
//   const input = path.join('samples', 'unresolved-local', 'main.js');
//   return rollup
//     .rollup({
//       input,
//       onwarn: expectNoWarnings,
//       plugins: [nodeResolve()]
//     })
//     .then(
//       () => {
//         throw Error('test should fail');
//       },
//       (err) => {
//         t.is(err.message, `Could not resolve './foo' from ${input}`);
//       }
//     );
// });
//
// test('mark as external to module outside the jail', async (t) =>
//   rollup
//     .rollup({
//       input: 'samples/jail/main.js',
//       onwarn: expectWarnings([
//         {
//           code: 'UNRESOLVED_IMPORT',
//           source: 'string/uppercase.js'
//         }
//       ]),
//       plugins: [
//         nodeResolve({
//           jail: `${__dirname}/samples/`
//         })
//       ]
//     })
//     .then(getBundleImports)
//     .then((imports) => t.deepEqual(imports, ['string/uppercase.js'])));
//
// test('bundle module defined inside the jail', async (t) =>
//   rollup
//     .rollup({
//       input: 'samples/jail/main.js',
//       onwarn: expectNoWarnings,
//       plugins: [
//         nodeResolve({
//           jail: `${__dirname}/`
//         })
//       ]
//     })
//     .then(getBundleImports)
//     .then((imports) => t.deepEqual(imports, [])));
//
// test('"only" option allows to specify the only packages to resolve', async (t) =>
//   rollup
//     .rollup({
//       input: 'samples/only/main.js',
//       onwarn: expectWarnings([
//         {
//           code: 'UNRESOLVED_IMPORT',
//           source: '@scoped/foo'
//         },
//         {
//           code: 'UNRESOLVED_IMPORT',
//           source: '@scoped/bar'
//         }
//       ]),
//       plugins: [
//         nodeResolve({
//           only: ['test']
//         })
//       ]
//     })
//     .then(getBundleImports)
//     .then((imports) => t.deepEqual(imports, ['@scoped/foo', '@scoped/bar'])));
//
// test('"only" option works with a regex', async (t) =>
//   rollup
//     .rollup({
//       input: 'samples/only/main.js',
//       onwarn: expectWarnings([
//         {
//           code: 'UNRESOLVED_IMPORT',
//           source: 'test'
//         }
//       ]),
//       plugins: [
//         nodeResolve({
//           only: [/^@scoped\/.*$/]
//         })
//       ]
//     })
//     .then(getBundleImports)
//     .then((imports) => t.deepEqual(imports, ['test'])));
//
// test('allows custom options', async (t) =>
//   rollup
//     .rollup({
//       input: 'samples/custom-resolve-options/main.js',
//       onwarn: expectNoWarnings,
//       plugins: [
//         nodeResolve({
//           customResolveOptions: {
//             moduleDirectory: 'js_modules'
//           }
//         })
//       ]
//     })
//     .then((bundle) => {
//       t.is(
//         bundle.cache.modules[0].id,
//         path.resolve(__dirname, 'samples/custom-resolve-options/js_modules/foo.js')
//       );
//     }));
//
// test('ignores deep-import non-modules', async (t) =>
//   rollup
//     .rollup({
//       input: 'samples/deep-import-non-module/main.js',
//       onwarn: expectWarnings([
//         {
//           code: 'UNRESOLVED_IMPORT',
//           source: 'foo/deep'
//         }
//       ]),
//       plugins: [
//         nodeResolve({
//           modulesOnly: true
//         })
//       ]
//     })
//     .then(getBundleImports)
//     .then((imports) => t.deepEqual(imports, ['foo/deep'])));
//
// test('generates manual chunks', async (t) => {
//   const chunkName = 'mychunk';
//   return rollup
//     .rollup({
//       input: 'samples/manualchunks/main.js',
//       onwarn: expectNoWarnings,
//       manualChunks: {
//         [chunkName]: ['simple']
//       },
//       plugins: [nodeResolve()]
//     })
//     .then((bundle) =>
//       bundle.generate({
//         format: 'esm',
//         chunkFileNames: '[name]'
//       })
//     )
//     .then((generated) => {
//       t.truthy(generated.output.find(({ fileName }) => fileName === chunkName));
//     });
// });
//
// test('resolves dynamic imports', async (t) =>
//   rollup
//     .rollup({
//       input: 'samples/dynamic/main.js',
//       onwarn: expectNoWarnings,
//       inlineDynamicImports: true,
//       plugins: [nodeResolve()]
//     })
//     .then(executeBundle)
//     .then(({ exports }) => exports.then((result) => t.is(result.default, 42))));
//
// test('pkg.browser with mapping to prevent bundle by specifying a value of false', async (t) =>
//   rollup
//     .rollup({
//       input: 'samples/browser-object-with-false/main.js',
//       plugins: [nodeResolve({ browser: true }), commonjs()]
//     })
//     .then(executeBundle)
//     .then((module) => {
//       t.is(module.exports, 'ok');
//     }));
//
// test('single module version is bundle if dedupe is set', async (t) =>
//   rollup
//     .rollup({
//       input: 'samples/react-app/main.js',
//       plugins: [
//         nodeResolve({
//           dedupe: ['react']
//         })
//       ]
//     })
//     .then(executeBundle)
//     .then((module) => {
//       t.deepEqual(module.exports, {
//         React: 'react:root',
//         ReactConsumer: 'react-consumer:react:root'
//       });
//     }));
//
// test('single module version is bundle if dedupe is set as a function', async (t) =>
//   rollup
//     .rollup({
//       input: 'samples/react-app/main.js',
//       plugins: [
//         nodeResolve({
//           dedupe: (dep) => dep === 'react'
//         })
//       ]
//     })
//     .then(executeBundle)
//     .then((module) => {
//       t.deepEqual(module.exports, {
//         React: 'react:root',
//         ReactConsumer: 'react-consumer:react:root'
//       });
//     }));
//
// test('multiple module versions are bundled if dedupe is not set', async (t) =>
//   rollup
//     .rollup({
//       input: 'samples/react-app/main.js',
//       plugins: [nodeResolve()]
//     })
//     .then(executeBundle)
//     .then((module) => {
//       t.deepEqual(module.exports, {
//         React: 'react:root',
//         ReactConsumer: 'react-consumer:react:child'
//       });
//     }));
//
// test('handles package side-effects', async (t) =>
//   rollup
//     .rollup({
//       input: 'samples/side-effects/main.js',
//       plugins: [nodeResolve()]
//     })
//     .then(executeBundle)
//     .then(() => {
//       t.deepEqual(global.sideEffects, [
//         'false-dep1',
//         'true-dep1',
//         'true-dep2',
//         'true-index',
//         'array-dep1',
//         'array-dep3',
//         'array-dep5',
//         'array-index'
//       ]);
//       delete global.sideEffects;
//     }));
