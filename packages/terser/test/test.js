const test = require('ava');
const { rollup } = require('rollup');

const terser = require('../');

test.serial('minify', async (t) => {
  const bundle = await rollup({
    input: 'test/fixtures/unminified.js',
    plugins: [terser()]
  });
  const result = await bundle.generate({ format: 'cjs' });
  t.is(result.output.length, 1);
  const [output] = result.output;
  t.is(output.code, '"use strict";window.a=5,window.a<3&&console.log(4);\n');
  t.falsy(output.map);
});

test.serial('minify with source map', async (t) => {
  const bundle = await rollup({
    input: 'test/fixtures/unminified.js',
    plugins: [terser()]
  });
  const result = await bundle.generate({ format: 'cjs', sourcemap: true });
  t.is(result.output.length, 2);
  const [output] = result.output;

  t.truthy(output.map);
  t.is(output.map.version, 3);
  t.is(output.map.file, 'unminified.js');
  t.deepEqual(output.map.names, ['window', 'a', 'console', 'log']);
});

test.serial('minify via terser options', async (t) => {
  const bundle = await rollup({
    input: 'test/fixtures/empty.js',
    plugins: [terser({ output: { comments: 'all' } })]
  });
  const result = await bundle.generate({
    banner: '/* package name */',
    format: 'cjs'
  });
  t.is(result.output.length, 1);
  const [output] = result.output;
  t.is(output.code, '/* package name */\n"use strict";\n');
  t.falsy(output.map);
});

test.serial('minify multiple outputs', async (t) => {
  const bundle = await rollup({
    input: 'test/fixtures/unminified.js',
    plugins: [terser()]
  });

  const [bundle1, bundle2] = await Promise.all([
    bundle.generate({ format: 'cjs' }),
    bundle.generate({ format: 'es' })
  ]);
  const [output1] = bundle1.output;
  const [output2] = bundle2.output;

  t.is(output1.code, '"use strict";window.a=5,window.a<3&&console.log(4);\n');
  t.is(output2.code, 'window.a=5,window.a<3&&console.log(4);\n');
});

test.serial('minify esm module', async (t) => {
  const bundle = await rollup({
    input: 'test/fixtures/plain-file.js',
    plugins: [terser()]
  });
  const result = await bundle.generate({ format: 'esm' });
  t.is(result.output.length, 1);
  const [output] = result.output;
  t.is(output.code, 'console.log("bar");\n');
});

test.serial('minify esm module with disabled module option', async (t) => {
  const bundle = await rollup({
    input: 'test/fixtures/plain-file.js',
    plugins: [terser({ module: false })]
  });
  const result = await bundle.generate({ format: 'esm' });
  t.is(result.output.length, 1);
  const [output] = result.output;
  t.is(output.code, 'const foo="bar";console.log(foo);\n');
});

test.serial('minify cjs module', async (t) => {
  const bundle = await rollup({
    input: 'test/fixtures/plain-file.js',
    plugins: [terser()]
  });
  const result = await bundle.generate({ format: 'cjs' });
  t.is(result.output.length, 1);
  const [output] = result.output;
  t.is(output.code, '"use strict";console.log("bar");\n');
});

test.serial('minify cjs module with disabled toplevel option', async (t) => {
  const bundle = await rollup({
    input: 'test/fixtures/plain-file.js',
    plugins: [terser({ toplevel: false })]
  });
  const result = await bundle.generate({ format: 'cjs' });
  t.is(result.output.length, 1);
  const [output] = result.output;
  t.is(output.code, '"use strict";const foo="bar";console.log(foo);\n');
});

test.serial('throw error on terser fail', async (t) => {
  try {
    const bundle = await rollup({
      input: 'test/fixtures/failed.js',
      plugins: [
        {
          renderChunk: () => {
            return { code: 'var = 1' };
          }
        },
        terser()
      ]
    });
    await bundle.generate({ format: 'esm' });
    t.falsy(true);
  } catch (error) {
    t.is(error.toString(), 'SyntaxError: Name expected');
  }
});

test.serial('throw error on terser fail with multiple outputs', async (t) => {
  try {
    const bundle = await rollup({
      input: 'test/fixtures/failed.js',
      plugins: [
        {
          renderChunk: () => {
            return { code: 'var = 1' };
          }
        },
        terser()
      ]
    });
    await Promise.all([bundle.generate({ format: 'cjs' }), bundle.generate({ format: 'esm' })]);
    t.falsy(true);
  } catch (error) {
    t.is(error.toString(), 'SyntaxError: Name expected');
  }
});

test.serial('allow to pass not string values to worker', async (t) => {
  const bundle = await rollup({
    input: 'test/fixtures/unminified.js',
    plugins: [terser({ mangle: { properties: { regex: /^_/ } } })]
  });
  const result = await bundle.generate({ format: 'cjs' });
  t.is(result.output.length, 1);
  const [output] = result.output;
  t.is(output.code, '"use strict";window.a=5,window.a<3&&console.log(4);\n');
});

test.serial('allow classic function definitions passing to worker', async (t) => {
  const bundle = await rollup({
    input: 'test/fixtures/commented.js',
    plugins: [
      terser({
        mangle: { properties: { regex: /^_/ } },
        output: {
          comments(node, comment) {
            if (comment.type === 'comment2') {
              // multiline comment
              return /@preserve|@license|@cc_on|^!/i.test(comment.value);
            }
            return false;
          }
        }
      })
    ]
  });
  const result = await bundle.generate({ format: 'cjs', compact: true });
  t.is(result.output.length, 1);
  const [output] = result.output;
  t.is(
    output.code,
    '"use strict";window.a=5,\n/* @preserve this comment */\nwindow.a<3&&console.log(4);'
  );
});

test.serial('allow method shorthand definitions passing to worker #2', async (t) => {
  const bundle = await rollup({
    input: 'test/fixtures/commented.js',
    plugins: [
      terser({
        mangle: { properties: { regex: /^_/ } },
        output: {
          comments(node, comment) {
            if (comment.type === 'comment2') {
              // multiline comment
              return /@preserve|@license|@cc_on|^!/i.test(comment.value);
            }
            return false;
          }
        }
      })
    ]
  });
  const result = await bundle.generate({ format: 'cjs', compact: true });
  t.is(result.output.length, 1);
  const [output] = result.output;
  t.is(
    output.code,
    '"use strict";window.a=5,\n/* @preserve this comment */\nwindow.a<3&&console.log(4);'
  );
});

test.serial('allow arrow function definitions passing to worker', async (t) => {
  const bundle = await rollup({
    input: 'test/fixtures/unminified.js',
    plugins: [
      terser({
        mangle: { properties: { regex: /^_/ } },
        output: {
          comments: (node, comment) => {
            if (comment.type === 'comment2') {
              // multiline comment
              return /@preserve|@license|@cc_on|^!/i.test.serial(comment.value);
            }
            return false;
          }
        }
      })
    ]
  });
  const result = await bundle.generate({ format: 'cjs' });
  t.is(result.output.length, 1);
  const [output] = result.output;
  t.is(output.code, '"use strict";window.a=5,window.a<3&&console.log(4);\n');
});

test.serial('allow to pass not string values to worker #2', async (t) => {
  const bundle = await rollup({
    input: 'test/fixtures/unminified.js',
    plugins: [terser({ mangle: { properties: { regex: /^_/ } } })]
  });
  const result = await bundle.generate({ format: 'cjs' });
  t.is(result.output[0].code, '"use strict";window.a=5,window.a<3&&console.log(4);\n');
});

test.serial('terser accepts the nameCache option', async (t) => {
  const nameCache = {
    props: {
      props: {
        $_priv: 'custom'
      }
    }
  };
  const bundle = await rollup({
    input: 'test/fixtures/properties.js',
    plugins: [
      terser({
        mangle: {
          properties: {
            regex: /^_/
          }
        },
        nameCache
      })
    ]
  });
  const result = await bundle.generate({ format: 'es' });
  t.is(result.output[0].code.trim(), `console.log({foo:1,custom:2});`);
});

test.serial('omits populates an empty nameCache object', async (t) => {
  const nameCache = {};
  const bundle = await rollup({
    input: 'test/fixtures/properties-and-locals.js',
    plugins: [
      terser({
        mangle: {
          properties: {
            regex: /./
          }
        },
        nameCache
      })
    ]
  });
  const result = await bundle.generate({ format: 'es' });
  t.is(
    result.output[0].code.trim(),
    `console.log({o:1,i:2},function o(n){return n>0?o(n-1):n}(10));`
  );
  t.deepEqual(nameCache, {
    props: {
      props: {
        $_priv: 'i',
        $foo: 'o'
      }
    },
    vars: {
      props: {}
    }
  });
});

// Note: nameCache.vars never gets populated, but this is a Terser issue.
// Here we're just testing that an empty vars object doesn't get added to nameCache if it wasn't there previously.
test.serial('terser preserve vars in nameCache when provided', async (t) => {
  const nameCache = {
    vars: {
      props: {}
    }
  };
  const bundle = await rollup({
    input: 'test/fixtures/properties-and-locals.js',
    plugins: [
      terser({
        mangle: {
          properties: {
            regex: /./
          }
        },
        nameCache
      })
    ]
  });
  const result = await bundle.generate({ format: 'es' });
  t.is(
    result.output[0].code.trim(),
    `console.log({o:1,i:2},function o(n){return n>0?o(n-1):n}(10));`
  );
  t.deepEqual(nameCache, {
    props: {
      props: {
        $_priv: 'i',
        $foo: 'o'
      }
    },
    vars: {
      props: {}
    }
  });
});
