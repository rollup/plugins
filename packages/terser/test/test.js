const test = require('ava');
const { rollup } = require("rollup");
const { terser } = require("../");

test("minify", async () => {
  const bundle = await rollup({
    input: "test/fixtures/unminified.js",
    plugins: [terser()],
  });
  const result = await bundle.generate({ format: "cjs" });
  expect(result.output).toHaveLength(1);
  const [output] = result.output;
  expect(output.code).toEqual(
    '"use strict";window.a=5,window.a<3&&console.log(4);\n'
  );
  expect(output.map).toBeFalsy();
});

test("minify via terser options", async () => {
  const bundle = await rollup({
    input: "test/fixtures/empty.js",
    plugins: [terser({ output: { comments: "all" } })],
  });
  const result = await bundle.generate({
    banner: "/* package name */",
    format: "cjs",
  });
  expect(result.output).toHaveLength(1);
  const [output] = result.output;
  expect(output.code).toEqual('/* package name */\n"use strict";\n');
  expect(output.map).toBeFalsy();
});

test("minify multiple outputs", async () => {
  const bundle = await rollup({
    input: "test/fixtures/unminified.js",
    plugins: [terser()],
  });

  const [bundle1, bundle2] = await Promise.all([
    bundle.generate({ format: "cjs" }),
    bundle.generate({ format: "es" }),
  ]);
  const [output1] = bundle1.output;
  const [output2] = bundle2.output;

  expect(output1.code).toEqual(
    '"use strict";window.a=5,window.a<3&&console.log(4);\n'
  );
  expect(output2.code).toEqual("window.a=5,window.a<3&&console.log(4);\n");
});

test("minify esm module", async () => {
  const bundle = await rollup({
    input: "test/fixtures/plain-file.js",
    plugins: [terser()],
  });
  const result = await bundle.generate({ format: "esm" });
  expect(result.output).toHaveLength(1);
  const [output] = result.output;
  expect(output.code).toEqual('console.log("bar");\n');
});

test("minify esm module with disabled module option", async () => {
  const bundle = await rollup({
    input: "test/fixtures/plain-file.js",
    plugins: [terser({ module: false })],
  });
  const result = await bundle.generate({ format: "esm" });
  expect(result.output).toHaveLength(1);
  const [output] = result.output;
  expect(output.code).toEqual('const foo="bar";console.log(foo);\n');
});

test("minify cjs module", async () => {
  const bundle = await rollup({
    input: "test/fixtures/plain-file.js",
    plugins: [terser()],
  });
  const result = await bundle.generate({ format: "cjs" });
  expect(result.output).toHaveLength(1);
  const [output] = result.output;
  expect(output.code).toEqual('"use strict";console.log("bar");\n');
});

test("minify cjs module with disabled toplevel option", async () => {
  const bundle = await rollup({
    input: "test/fixtures/plain-file.js",
    plugins: [terser({ toplevel: false })],
  });
  const result = await bundle.generate({ format: "cjs" });
  expect(result.output).toHaveLength(1);
  const [output] = result.output;
  expect(output.code).toEqual(
    '"use strict";const foo="bar";console.log(foo);\n'
  );
});

test("minify with sourcemaps", async () => {
  const bundle = await rollup({
    input: "test/fixtures/sourcemap.js",
    plugins: [terser()],
  });
  const result = await bundle.generate({ format: "cjs", sourcemap: true });
  expect(result.output).toHaveLength(1);
  const [output] = result.output;
  expect(output.map).toMatchInlineSnapshot(`
    SourceMap {
      "file": "sourcemap.js",
      "mappings": "aAEAA,QAAQC,ICFO",
      "names": Array [
        "console",
        "log",
      ],
      "sources": Array [
        "test/fixtures/sourcemap.js",
        "test/fixtures/export-number.js",
      ],
      "sourcesContent": Array [
        "import result from './export-number.js';

    console.log(result);
    ",
        "export default 5;
    ",
      ],
      "version": 3,
    }
  `);
});

test('work with sourcemap: "inline"', async () => {
  const bundle = await rollup({
    input: "test/fixtures/sourcemap.js",
    plugins: [terser()],
  });
  const result = await bundle.generate({ format: "cjs", sourcemap: "inline" });
  expect(result.output).toHaveLength(1);
  const [output] = result.output;
  expect(output.map).toMatchInlineSnapshot(`
    SourceMap {
      "file": "sourcemap.js",
      "mappings": "aAEAA,QAAQC,ICFO",
      "names": Array [
        "console",
        "log",
      ],
      "sources": Array [
        "test/fixtures/sourcemap.js",
        "test/fixtures/export-number.js",
      ],
      "sourcesContent": Array [
        "import result from './export-number.js';

    console.log(result);
    ",
        "export default 5;
    ",
      ],
      "version": 3,
    }
  `);
});

test("does not allow to pass sourcemap option", async () => {
  try {
    const bundle = await rollup({
      input: "test/fixtures/sourcemap.js",
      plugins: [terser({ sourcemap: false })],
    });
    expect(true).toBeFalsy();
  } catch (error) {
    expect(error.toString()).toMatch(/sourcemap option is removed/);
  }
});

test("does not allow to pass sourceMap option", async () => {
  try {
    const bundle = await rollup({
      input: "test/fixtures/sourcemap.js",
      plugins: [terser({ sourceMap: false })],
    });
    expect(true).toBeFalsy();
  } catch (error) {
    expect(error.toString()).toMatch(/sourceMap option is removed/);
  }
});

test("throw error on terser fail", async () => {
  try {
    const bundle = await rollup({
      input: "test/fixtures/failed.js",
      plugins: [
        {
          renderChunk: () => ({ code: "var = 1" }),
        },
        terser(),
      ],
    });
    await bundle.generate({ format: "esm" });
    expect(true).toBeFalsy();
  } catch (error) {
    expect(error.toString()).toMatch(/Name expected/);
  }
});

test("throw error on terser fail with multiple outputs", async () => {
  try {
    const bundle = await rollup({
      input: "test/fixtures/failed.js",
      plugins: [
        {
          renderChunk: () => ({ code: "var = 1" }),
        },
        terser(),
      ],
    });
    await Promise.all([
      bundle.generate({ format: "cjs" }),
      bundle.generate({ format: "esm" }),
    ]);
    expect(true).toBeFalsy();
  } catch (error) {
    expect(error.toString()).toMatch(/Name expected/);
  }
});

test("works with code splitting", async () => {
  const bundle = await rollup({
    input: ["test/fixtures/chunk-1.js", "test/fixtures/chunk-2.js"],
    plugins: [terser()],
  });
  const { output } = await bundle.generate({ format: "esm" });
  const newOutput = {};
  output.forEach((out) => {
    // TODO rewrite with object rest after node 6 dropping
    const value = Object.assign({}, out);
    delete value.modules;
    delete value.facadeModuleId;
    newOutput[out.fileName] = value;
  });
  expect(newOutput).toMatchSnapshot();
});

test("allow to pass not string values to worker", async () => {
  const bundle = await rollup({
    input: "test/fixtures/unminified.js",
    plugins: [terser({ mangle: { properties: { regex: /^_/ } } })],
  });
  const result = await bundle.generate({ format: "cjs" });
  expect(result.output).toHaveLength(1);
  const [output] = result.output;
  expect(output.code).toEqual(
    '"use strict";window.a=5,window.a<3&&console.log(4);\n'
  );
});

test("allow classic function definitions passing to worker", async () => {
  const bundle = await rollup({
    input: "test/fixtures/commented.js",
    plugins: [
      terser({
        mangle: { properties: { regex: /^_/ } },
        output: {
          comments: function (node, comment) {
            if (comment.type === "comment2") {
              // multiline comment
              return /@preserve|@license|@cc_on|^!/i.test(comment.value);
            }
            return false;
          },
        },
      }),
    ],
  });
  const result = await bundle.generate({ format: "cjs", compact: true });
  expect(result.output).toHaveLength(1);
  const [output] = result.output;
  expect(output.code).toEqual(
    '"use strict";window.a=5,\n/* @preserve this comment */\nwindow.a<3&&console.log(4);'
  );
});

test("allow method shorthand definitions passing to worker", async () => {
  const bundle = await rollup({
    input: "test/fixtures/commented.js",
    plugins: [
      terser({
        mangle: { properties: { regex: /^_/ } },
        output: {
          comments(node, comment) {
            if (comment.type === "comment2") {
              // multiline comment
              return /@preserve|@license|@cc_on|^!/i.test(comment.value);
            }
            return false;
          },
        },
      }),
    ],
  });
  const result = await bundle.generate({ format: "cjs", compact: true });
  expect(result.output).toHaveLength(1);
  const [output] = result.output;
  expect(output.code).toEqual(
    '"use strict";window.a=5,\n/* @preserve this comment */\nwindow.a<3&&console.log(4);'
  );
});

test("allow arrow function definitions passing to worker", async () => {
  const bundle = await rollup({
    input: "test/fixtures/unminified.js",
    plugins: [
      terser({
        mangle: { properties: { regex: /^_/ } },
        output: {
          comments: (node, comment) => {
            if (comment.type === "comment2") {
              // multiline comment
              return /@preserve|@license|@cc_on|^!/i.test(comment.value);
            }
            return false;
          },
        },
      }),
    ],
  });
  const result = await bundle.generate({ format: "cjs" });
  expect(result.output).toHaveLength(1);
  const [output] = result.output;
  expect(output.code).toEqual(
    '"use strict";window.a=5,window.a<3&&console.log(4);\n'
  );
});

test("allow to pass not string values to worker", async () => {
  const bundle = await rollup({
    input: "test/fixtures/unminified.js",
    plugins: [terser({ mangle: { properties: { regex: /^_/ } } })],
  });
  const result = await bundle.generate({ format: "cjs" });
  expect(result.output[0].code).toEqual(
    '"use strict";window.a=5,window.a<3&&console.log(4);\n'
  );
});

test("terser accepts the nameCache option", async () => {
  const nameCache = {
    props: {
      props: {
        $_priv: "custom",
      },
    },
  };
  const bundle = await rollup({
    input: "test/fixtures/properties.js",
    plugins: [
      terser({
        mangle: {
          properties: {
            regex: /^_/,
          },
        },
        nameCache,
      }),
    ],
  });
  const result = await bundle.generate({ format: "es" });
  expect(result.output[0].code.trim()).toEqual(
    `console.log({foo:1,custom:2});`
  );
});

test("terser updates the nameCache object", async () => {
  const nameCache = {
    props: {
      props: {
        $_priv: "f",
      },
    },
  };
  const props = nameCache.props;
  const bundle = await rollup({
    input: "test/fixtures/properties.js",
    plugins: [
      terser({
        mangle: {
          properties: {
            regex: /./,
          },
        },
        nameCache,
      }),
    ],
  });
  const result = await bundle.generate({ format: "es" });
  expect(result.output[0].code.trim()).toEqual(`console.log({o:1,f:2});`);
  expect(nameCache.props).toBe(props);
  expect(nameCache).toEqual({
    props: {
      props: {
        $_priv: "f",
        $foo: "o",
      },
    },
  });
});

test("omits populates an empty nameCache object", async () => {
  const nameCache = {};
  const bundle = await rollup({
    input: "test/fixtures/properties-and-locals.js",
    plugins: [
      terser({
        mangle: {
          properties: {
            regex: /./,
          },
        },
        nameCache,
      }),
    ],
  });
  const result = await bundle.generate({ format: "es" });
  expect(result.output[0].code.trim()).toEqual(
    `console.log({o:1,i:2},function o(n){return n>0?o(n-1):n}(10));`
  );
  expect(nameCache).toEqual({
    props: {
      props: {
        $_priv: "i",
        $foo: "o",
      },
    },
  });
});

// Note: nameCache.vars never gets populated, but this is a Terser issue.
// Here we're just testing that an empty vars object doesn't get added to nameCache if it wasn't there previously.
test("terser preserve vars in nameCache when provided", async () => {
  const nameCache = {
    vars: {
      props: {},
    },
  };
  const bundle = await rollup({
    input: "test/fixtures/properties-and-locals.js",
    plugins: [
      terser({
        mangle: {
          properties: {
            regex: /./,
          },
        },
        nameCache,
      }),
    ],
  });
  const result = await bundle.generate({ format: "es" });
  expect(result.output[0].code.trim()).toEqual(
    `console.log({o:1,i:2},function o(n){return n>0?o(n-1):n}(10));`
  );
  expect(nameCache).toEqual({
    props: {
      props: {
        $_priv: "i",
        $foo: "o",
      },
    },
    vars: {
      props: {},
    },
  });
});
