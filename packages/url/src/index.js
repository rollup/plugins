import {createFilter} from "rollup-pluginutils"
import mime from "mime"
import crypto from "crypto"
import path from "path"
import fs from "fs"

const defaultInclude = [
  "**/*.svg",
  "**/*.png",
  "**/*.jpg",
  "**/*.gif",
]

export default function url(options = {}) {
  const {
    limit = 14 * 1024,
    include = defaultInclude,
    exclude,
    publicPath = "",
    emitFiles = true,
    fileName = "[hash][extname]"
  } = options
  const filter = createFilter(include, exclude)

  const copies = Object.create(null)

  return {
    load(id) {
      if (!filter(id)) {
        return null
      }
      return Promise.all([
        promise(fs.stat, id),
        promise(fs.readFile, id),
      ]).then(([stats, buffer]) => {
        let data
        if ((limit && stats.size > limit) || limit === 0) {
          const hash = crypto.createHash("sha1")
            .update(buffer)
            .digest("hex")
            .substr(0, 16)
          const ext = path.extname(id)
          const name = path.basename(id, ext)
          // Determine the directory name of the file based
          // on either the relative path provided in options,
          // or the parent directory
          const relativeDir = options.sourceDir
            ? path.relative(options.sourceDir, path.dirname(id))
            : path.dirname(id).split(path.sep).pop()

          // Generate the output file name based on some string
          // replacement parameters
          const outputFileName = fileName
            .replace(/\[hash\]/g, hash)
            .replace(/\[extname\]/g, ext)
            .replace(/\[dirname\]/g, `${relativeDir}/`)
            .replace(/\[name\]/g, name)
          data = `${publicPath}${outputFileName}`
          copies[id] = outputFileName
        } else {
          const mimetype = mime.getType(id)
          const isSVG = mimetype === "image/svg+xml"
          data = isSVG
            ? encodeSVG(buffer)
            : buffer.toString("base64")
          const encoding = isSVG ? "" : ";base64"
          data = `data:${mimetype}${encoding},${data}`
        }
        return `export default "${data}"`
      })
    },
    generateBundle: async function write(outputOptions) {
      // Allow skipping saving files for server side builds.
      if (!emitFiles) return

      const base = options.destDir || outputOptions.dir || path.dirname(outputOptions.file)

      await promise(mkpath, base)

      return Promise.all(Object.keys(copies).map(async name => {
        const output = copies[name]
        // Create a nested directory if the fileName pattern contains
        // a directory structure
        const outputDirectory = path.join(base, path.dirname(output))
        await promise(mkpath, outputDirectory)
        return copy(name, path.join(base, output))
      }))
    }
  }
}

function promise(fn, ...args) {
  return new Promise((resolve, reject) =>
                     fn(...args, (err, res) =>
                        err ? reject(err) : resolve(res)))
}

function copy(src, dest) {
  return new Promise((resolve, reject) => {
    const read = fs.createReadStream(src)
    read.on("error", reject)
    const write = fs.createWriteStream(dest)
    write.on("error", reject)
    write.on("finish", resolve)
    read.pipe(write)
  })
}

// https://github.com/filamentgroup/directory-encoder/blob/master/lib/svg-uri-encoder.js
function encodeSVG(buffer) {
  return encodeURIComponent(buffer.toString("utf-8")
    // strip newlines and tabs
    .replace(/[\n\r]/gmi, "")
    .replace(/\t/gmi, " ")
    // strip comments
    .replace(/<!\-\-(.*(?=\-\->))\-\->/gmi, "")
    // replace
    .replace(/'/gmi, "\\i"))
    // encode brackets
    .replace(/\(/g, "%28").replace(/\)/g, "%29")
}

// use fs.mkdir to instead of mkpath package, see https://github.com/jrajav/mkpath/issues/6
function mkpath(path, err) {
  return fs.mkdir(path, { recursive: true }, err);
}
