const fs = require("fs");
const { rollup } = require("rollup");
const nodeResolve = require("rollup-plugin-node-resolve");
const { eslint } = require("../");

test("should lint files", () => {
  let count = 0;
  return rollup({
    input: "./test/fixtures/undeclared.js",
    plugins: [
      eslint({
        formatter: results => {
          count += results[0].messages.length;
          const message = results[0].messages[0].message;
          expect(message).toEqual("'x' is not defined.");
        }
      })
    ]
  }).then(() => {
    expect(count).toEqual(1);
  });
});

test("should not fail with default options", () => {
  return rollup({
    input: "./test/fixtures/undeclared.js",
    plugins: [eslint()]
  });
});

test("should ignore node_modules with exclude option", () => {
  let count = 0;
  return rollup({
    input: "./test/fixtures/modules.js",
    plugins: [
      nodeResolve({ jsnext: true }),
      eslint({
        configFile: "./test/fixtures/.eslintrc-babel",
        formatter: () => {
          count += 1;
        }
      })
    ]
  }).then(() => {
    expect(count).toEqual(0);
  });
});

test("should ignore files according .eslintignore", () => {
  let count = 0;
  return rollup({
    input: "./test/fixtures/ignored.js",
    plugins: [
      eslint({
        formatter: results => {
          count += 1;
        }
      })
    ]
  }).then(() => {
    expect(count).toEqual(0);
  });
});

test("should fail with enabled throwOnWarning and throwOnError options", () => {
  return expect(
    rollup({
      input: "./test/fixtures/use-strict.js",
      plugins: [
        eslint({
          throwOnWarning: true,
          throwOnError: true,
          formatter: () => ""
        })
      ]
    }).catch(e => Promise.reject(e.toString()))
  ).rejects.toMatch(/Warnings or errors were found/);
});

test("should fail with enabled throwOnError option", () => {
  return expect(
    rollup({
      input: "./test/fixtures/use-strict.js",
      plugins: [
        eslint({
          throwOnError: true,
          formatter: () => ""
        })
      ]
    }).catch(e => Promise.reject(e.toString()))
  ).rejects.toMatch(/Errors were found/);
});

test("should fail with enabled throwOnWarning option", () => {
  return expect(
    rollup({
      input: "./test/fixtures/use-strict.js",
      plugins: [
        eslint({
          throwOnWarning: true,
          formatter: () => ""
        })
      ]
    }).catch(e => Promise.reject(e.toString()))
  ).rejects.toMatch(/Warnings were found/);
});

test("should not fail with throwOnError and throwOnWarning disabled", () => {
  return rollup({
    input: "./test/fixtures/use-strict.js",
    plugins: [
      eslint({
        throwOnError: false,
        throwOnWarning: false,
        formatter: () => ""
      })
    ]
  });
});

test("should fail with not found formatter", () => {
  expect(() => {
    eslint({ formatter: "not-found-formatter" });
  }).toThrowError(/There was a problem loading formatter/);
});

test("should not fail with found formatter", () => {
  return rollup({
    input: "./test/fixtures/use-strict.js",
    plugins: [
      eslint({
        formatter: "stylish"
      })
    ]
  });
});

test("should fix source code", () => {
  fs.writeFileSync(
    "./test/fixtures/fixable-clone.js",
    fs.readFileSync("./test/fixtures/fixable.js")
  );
  return rollup({
    input: "./test/fixtures/fixable-clone.js",
    plugins: [
      eslint({
        fix: true
      })
    ]
  }).then(() => {
    expect(
      fs.readFileSync("./test/fixtures/fixable-clone.js").toString()
    ).toEqual(fs.readFileSync("./test/fixtures/fixed.js").toString());
    fs.unlinkSync("./test/fixtures/fixable-clone.js");
  });
});
