import assert from "assert"
import fs from "fs"
import path from "path"
import rimraf from "rimraf"
import {rollup} from "rollup"
import url from "../"

const dest = "output/output.js"
const dir = "output/splitting"

process.chdir(__dirname)

const svghash = "98ea1a8cc8cd9baf.svg"
const pnghash = "6b71fbe07b498a82.png"
const pngname = "png.png"

const asserts = {
  svgInline: `var svg = "data:image/svg+xml,%3Csvg%3E%3Cpath%20d%3D%22%22%2F%3E%3C%2Fsvg%3E";\nexport default svg;`,
  svgExport: `var svg = "${svghash}";\nexport default svg;`,
  pngInline: `var png = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGP6DwABBQECz6AuzQAAAABJRU5ErkJggg==";\nexport default png;`,
  pngExport: `var png = "${pnghash}";\nexport default png;`
}

describe("rollup-plugin-url", () => {
  after(() => promise(rimraf, "output/"))

  it("should inline text files", () =>
    run("./fixtures/svg.js", 10 * 1024)
      .then(
        () => Promise.all([
          assertOutput(asserts.svgInline),
          assertExists(`output/${svghash}`, false),
        ])
      )
  )

  it("should not copy files when limit is 0 and emitFiles is off", () =>
    run("./fixtures/svg.js", { limit: 0, publicPath: "", emitFiles: false })
      .then(
        () => Promise.all([
          assertOutput(asserts.svgExport),
          assertExists(`output/${svghash}`, false),
        ])
      )
  )

  it("should copy files when limit is 0", () =>
    run("./fixtures/svg.js", { limit: 0 })
      .then(
        () => Promise.all([
          assertOutput(asserts.svgExport),
          assertExists(`output/${svghash}`),
        ])
      )
  )

  it("should inline binary files", () =>
    run("./fixtures/png.js", { limit: 10 * 1024 })
      .then(
        () => Promise.all([
          assertOutput(asserts.pngInline),
          assertExists(`output/${pnghash}`, false),
        ])
      )
  )

  it("should copy large text files", () =>
    run("./fixtures/svg.js", { limit: 10 })
      .then(
        () => Promise.all([
          assertOutput(asserts.svgExport),
          assertExists(`output/${svghash}`),
        ])
      )
  )

  it("should copy large binary files", () =>
    run("./fixtures/png.js", { limit: 10 })
      .then(
        () => Promise.all([
          assertOutput(asserts.pngExport),
          assertExists(`output/${pnghash}`),
        ])
      )
  )

  it("should use publicPath", () =>
    run("./fixtures/png.js", { limit: 10, publicPath: "/foo/bar/" })
      .then(
        () => Promise.all([
          assertOutput(`var png = "/foo/bar/${pnghash}";\nexport default png;`),
        ])
      )
  )

  it("should create a nested directory for the output, if required", () =>
    run("./fixtures/png.js", { limit: 10, fileName: "subdirectory/[hash][extname]" })
      .then(
        () => Promise.all([
          assertExists(`output/subdirectory/${pnghash}`)
        ])
      )
  )

  it("should create a file with the name and extension of the file", () =>
    run("./fixtures/png.js", { limit: 10, fileName: "[name][extname]" })
      .then(
        () => Promise.all([
          assertExists(`output/${pngname}`)
        ])
      )
  )

  it("should create a file with the name, hash and extension of the file", () =>
    run("./fixtures/png.js", { limit: 10, fileName: "[name]-[hash][extname]" })
      .then(
        () => Promise.all([
          assertExists(`output/png-${pnghash}`)
        ])
      )
  )

  it("should prefix the file with the parent directory of the source file", () =>
    run("./fixtures/png.js", { limit: 10, fileName: "[dirname][hash][extname]" })
      .then(
        () => Promise.all([
          assertExists(`output/fixtures/${pnghash}`)
        ])
      )
  )

  it("should prefix the file with the parent directory of the source file, relative to the sourceDir option", () =>
    run("./fixtures/png.js", { limit: 10, fileName: "[dirname][hash][extname]", sourceDir: path.join(__dirname, "../") })
      .then(
        () => Promise.all([
          assertExists(`output/test/fixtures/${pnghash}`)
        ])
      )
  )

  it("should copy the file according to destDir option", () =>
    run("./fixtures/png.js", { limit: 10, fileName: "[dirname][hash][extname]", destDir: path.join(__dirname, "output/dest") })
      .then(
        () => Promise.all([
          assertExists(`output/dest/fixtures/${pnghash}`)
        ])
      )
  )

  it("should create multiple modules and inline files", () => {
    return run(["./fixtures/svg.js", "./fixtures/png.js"], {}, true)
      .then(
        () => Promise.all([
          assertOutput(asserts.pngInline, `${dir}/png.js`),
          assertOutput(asserts.svgInline, `${dir}/svg.js`)
        ])
      )
  })

  it("should create multiple modules and copy files", () => {
    return run(["./fixtures/svg.js", "./fixtures/png.js"], { limit: 0 }, true)
      .then(
        () => Promise.all([
          assertOutput(asserts.pngExport, `${dir}/png.js`),
          assertOutput(asserts.svgExport, `${dir}/svg.js`),
          assertExists(`${dir}/${svghash}`),
          assertExists(`${dir}/${pnghash}`)
        ])
      )
  })
})

function promise(fn, ...args) {
  return new Promise((resolve, reject) =>
    fn(...args, (err, res) =>
      err ? reject(err) : resolve(res)))
}

const DEFAULT_OPTIONS = {
  publicPath: "",
  emitFiles: true
}

function run(input, options, experimentalCodeSplitting = false) {
  const writeOptions = {
    format: 'es'
  }

  if (!experimentalCodeSplitting) {
    Object.assign(writeOptions, {
      file: dest
    })
  } else {
    Object.assign(writeOptions, {
      dir
    })
  }

  return rollup({
    input,
    plugins: [url(Object.assign({}, DEFAULT_OPTIONS, options))],
  }).then(bundle => bundle.write(writeOptions))
}

function assertOutput(content, file = dest) {
  return promise(fs.readFile, file, "utf-8")
    .then(fileContent => assert.equal(fileContent.replace(/[\W]/gi, ''), content.replace(/[\W]/gi, '')))
}

function assertExists(name, shouldExist = true) {
  return promise(fs.stat, name)
    .then(() => true, () => false)
    .then(exists => assert.ok(exists === shouldExist))
}
