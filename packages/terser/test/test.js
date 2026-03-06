const { rollup } = require('rollup');

const terser = require('../');

test.sequential('minify', async () => {
  const bundle = await rollup({
    input: 'test/fixtures/unminified.js',
    plugins: [terser()]
  });
  const result = await bundle.generate({
    format: 'cjs'
  });
  expect(result.output.length).toBe(1);
  const [output] = result.output;
  expect(output.code).toBe('"use strict";window.a=5,window.a<3&&console.log(4);\n');
  expect(output.map).toBeFalsy();
});
test.sequential('minify with source map', async () => {
  const bundle = await rollup({
    input: 'test/fixtures/unminified.js',
    plugins: [terser()]
  });
  const result = await bundle.generate({
    format: 'cjs',
    sourcemap: true
  });
  expect(result.output.length).toBe(2);
  const [output] = result.output;
  expect(output.map).toBeTruthy();
  expect(output.map.version).toBe(3);
  expect(output.map.file).toBe('unminified.js');
  expect(output.map.names).toEqual(['window', 'a', 'console', 'log']);
});
test.sequential('minify via terser options', async () => {
  const bundle = await rollup({
    input: 'test/fixtures/empty.js',
    plugins: [
      terser({
        output: {
          comments: 'all'
        }
      })
    ]
  });
  const result = await bundle.generate({
    banner: '/* package name */',
    format: 'cjs'
  });
  expect(result.output.length).toBe(1);
  const [output] = result.output;
  expect(output.code).toBe('/* package name */\n"use strict";\n');
  expect(output.map).toBeFalsy();
});
test.sequential('minify multiple outputs', async () => {
  let plugin;
  const bundle = await rollup({
    input: 'test/fixtures/unminified.js',
    plugins: [
      (plugin = terser({
        maxWorkers: 2
      }))
    ]
  });
  const [bundle1, bundle2] = await Promise.all([
    bundle.generate({
      format: 'cjs'
    }),
    bundle.generate({
      format: 'es'
    })
  ]);
  const [output1] = bundle1.output;
  const [output2] = bundle2.output;
  expect(output1.code).toBe('"use strict";window.a=5,window.a<3&&console.log(4);\n');
  expect(output2.code).toBe('window.a=5,window.a<3&&console.log(4);\n');
  expect(plugin.numOfWorkersUsed).toBe(2);
});
test.sequential('minify multiple outputs with only 1 worker', async () => {
  let plugin;
  const bundle = await rollup({
    input: 'test/fixtures/unminified.js',
    plugins: [
      (plugin = terser({
        maxWorkers: 1
      }))
    ]
  });
  await Promise.all([
    bundle.generate({
      format: 'cjs'
    }),
    bundle.generate({
      format: 'es'
    })
  ]);
  expect(plugin.numOfWorkersUsed).toBe(1);
});
test.sequential('minify esm module', async () => {
  const bundle = await rollup({
    input: 'test/fixtures/plain-file.js',
    plugins: [terser()]
  });
  const result = await bundle.generate({
    format: 'esm'
  });
  expect(result.output.length).toBe(1);
  const [output] = result.output;
  expect(output.code).toBe('console.log("bar");\n');
});
test.sequential('minify esm module with disabled module option', async () => {
  const bundle = await rollup({
    input: 'test/fixtures/plain-file.js',
    plugins: [
      terser({
        module: false
      })
    ]
  });
  const result = await bundle.generate({
    format: 'esm'
  });
  expect(result.output.length).toBe(1);
  const [output] = result.output;
  expect(output.code).toBe('const foo="bar";console.log(foo);\n');
});
test.sequential('minify cjs module', async () => {
  const bundle = await rollup({
    input: 'test/fixtures/plain-file.js',
    plugins: [terser()]
  });
  const result = await bundle.generate({
    format: 'cjs'
  });
  expect(result.output.length).toBe(1);
  const [output] = result.output;
  expect(output.code).toBe('"use strict";console.log("bar");\n');
});
test.sequential('minify cjs module with disabled toplevel option', async () => {
  const bundle = await rollup({
    input: 'test/fixtures/plain-file.js',
    plugins: [
      terser({
        toplevel: false
      })
    ]
  });
  const result = await bundle.generate({
    format: 'cjs'
  });
  expect(result.output.length).toBe(1);
  const [output] = result.output;
  expect(output.code).toBe('"use strict";const foo="bar";console.log(foo);\n');
});
test.sequential('throw error on terser fail', async () => {
  try {
    const bundle = await rollup({
      input: 'test/fixtures/failed.js',
      plugins: [
        {
          renderChunk: () => {
            return {
              code: 'var = 1'
            };
          }
        },
        terser()
      ]
    });
    await bundle.generate({
      format: 'esm'
    });
    expect(true).toBeFalsy();
  } catch (error) {
    expect(error.toString()).toBe('SyntaxError: Name expected');
  }
});
test.sequential('throw error on terser fail with multiple outputs', async () => {
  try {
    const bundle = await rollup({
      input: 'test/fixtures/failed.js',
      plugins: [
        {
          renderChunk: () => {
            return {
              code: 'var = 1'
            };
          }
        },
        terser()
      ]
    });
    await Promise.all([
      bundle.generate({
        format: 'cjs'
      }),
      bundle.generate({
        format: 'esm'
      })
    ]);
    expect(true).toBeFalsy();
  } catch (error) {
    expect(error.toString()).toBe('SyntaxError: Name expected');
  }
});
test.sequential('allow to pass not string values to worker', async () => {
  const bundle = await rollup({
    input: 'test/fixtures/unminified.js',
    plugins: [
      terser({
        mangle: {
          properties: {
            regex: /^_/
          }
        }
      })
    ]
  });
  const result = await bundle.generate({
    format: 'cjs'
  });
  expect(result.output.length).toBe(1);
  const [output] = result.output;
  expect(output.code).toBe('"use strict";window.a=5,window.a<3&&console.log(4);\n');
});
test.sequential('allow classic function definitions passing to worker', async () => {
  const bundle = await rollup({
    input: 'test/fixtures/commented.js',
    plugins: [
      terser({
        mangle: {
          properties: {
            regex: /^_/
          }
        },
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
  const result = await bundle.generate({
    format: 'cjs',
    compact: true
  });
  expect(result.output.length).toBe(1);
  const [output] = result.output;
  expect(output.code).toBe(
    '"use strict";window.a=5,\n/* @preserve this comment */\nwindow.a<3&&console.log(4);'
  );
});
test.sequential('allow method shorthand definitions passing to worker #2', async () => {
  const bundle = await rollup({
    input: 'test/fixtures/commented.js',
    plugins: [
      terser({
        mangle: {
          properties: {
            regex: /^_/
          }
        },
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
  const result = await bundle.generate({
    format: 'cjs',
    compact: true
  });
  expect(result.output.length).toBe(1);
  const [output] = result.output;
  expect(output.code).toBe(
    '"use strict";window.a=5,\n/* @preserve this comment */\nwindow.a<3&&console.log(4);'
  );
});
test.sequential('allow arrow function definitions passing to worker', async () => {
  const bundle = await rollup({
    input: 'test/fixtures/unminified.js',
    plugins: [
      terser({
        mangle: {
          properties: {
            regex: /^_/
          }
        },
        output: {
          comments: (node, comment) => {
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
  const result = await bundle.generate({
    format: 'cjs'
  });
  expect(result.output.length).toBe(1);
  const [output] = result.output;
  expect(output.code).toBe('"use strict";window.a=5,window.a<3&&console.log(4);\n');
});
test.sequential('allow to pass not string values to worker #2', async () => {
  const bundle = await rollup({
    input: 'test/fixtures/unminified.js',
    plugins: [
      terser({
        mangle: {
          properties: {
            regex: /^_/
          }
        }
      })
    ]
  });
  const result = await bundle.generate({
    format: 'cjs'
  });
  expect(result.output[0].code).toBe('"use strict";window.a=5,window.a<3&&console.log(4);\n');
});
test.sequential('terser accepts the nameCache option', async () => {
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
  const result = await bundle.generate({
    format: 'es'
  });
  expect(result.output[0].code.trim()).toBe(`console.log({foo:1,custom:2});`);
});
test.sequential('omits populates an empty nameCache object', async () => {
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
  const result = await bundle.generate({
    format: 'es'
  });
  expect(result.output[0].code.trim()).toBe(
    `console.log({o:1,i:2},function o(n){return n>0?o(n-1):n}(10));`
  );
  expect(nameCache).toEqual({
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
test.sequential('terser preserve vars in nameCache when provided', async () => {
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
  const result = await bundle.generate({
    format: 'es'
  });
  expect(result.output[0].code.trim()).toBe(
    `console.log({o:1,i:2},function o(n){return n>0?o(n-1):n}(10));`
  );
  expect(nameCache).toEqual({
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
