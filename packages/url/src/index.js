import crypto from 'crypto';
import path from 'path';
import util from 'util';
import fs from 'fs';

import makeDir from 'make-dir';
import mime from 'mime';
import { createFilter } from '@rollup/pluginutils';

const fsStatPromise = util.promisify(fs.stat);
const fsReadFilePromise = util.promisify(fs.readFile);
const { posix, sep } = path;
const defaultInclude = ['**/*.svg', '**/*.png', '**/*.jp(e)?g', '**/*.gif', '**/*.webp'];

export default function url(options = {}) {
  const {
    limit = 14 * 1024,
    include = defaultInclude,
    exclude,
    publicPath = '',
    emitFiles = true,
    fileName = '[hash][extname]'
  } = options;
  const filter = createFilter(include, exclude);

  const copies = Object.create(null);

  return {
    name: 'url',
    load(id, loadOptions) {
      const rawId = (loadOptions && loadOptions.rawId) || id;
      if (!filter(rawId)) {
        return null;
      }
      this.addWatchFile(rawId);
      return Promise.all([fsStatPromise(rawId), fsReadFilePromise(rawId)]).then(
        ([stats, buffer]) => {
          let data;
          if ((limit && stats.size > limit) || limit === 0) {
            const hash = crypto.createHash('sha1').update(buffer).digest('hex').substr(0, 16);
            const ext = path.extname(rawId);
            const name = path.basename(rawId, ext);
            // Determine the directory name of the file based
            // on either the relative path provided in options,
            // or the parent directory
            const relativeDir = options.sourceDir
              ? path.relative(options.sourceDir, path.dirname(rawId))
              : path.dirname(rawId).split(sep).pop();

            // Generate the output file name based on some string
            // replacement parameters
            const outputFileName = fileName
              .replace(/\[hash\]/g, hash)
              .replace(/\[extname\]/g, ext)
              // use `sep` for windows environments
              .replace(/\[dirname\]/g, relativeDir === '' ? '' : `${relativeDir}${sep}`)
              .replace(/\[name\]/g, name);
            // Windows fix - exports must be in unix format
            data = `${publicPath}${outputFileName.split(sep).join(posix.sep)}`;
            copies[rawId] = outputFileName;
          } else {
            const mimetype = mime.getType(rawId);
            const isSVG = mimetype === 'image/svg+xml';
            data = isSVG ? encodeSVG(buffer) : buffer.toString('base64');
            const encoding = isSVG ? '' : ';base64';
            data = `data:${mimetype}${encoding},${data}`;
          }
          return `export default "${data}"`;
        }
      );
    },
    generateBundle: async function write(outputOptions) {
      // Allow skipping saving files for server side builds.
      if (!emitFiles) return;

      const base = options.destDir || outputOptions.dir || path.dirname(outputOptions.file);

      await makeDir(base);

      await Promise.all(
        Object.keys(copies).map(async (name) => {
          const output = copies[name];
          // Create a nested directory if the fileName pattern contains
          // a directory structure
          const outputDirectory = path.join(base, path.dirname(output));
          await makeDir(outputDirectory);
          return copy(name, path.join(base, output));
        })
      );
    }
  };
}

function copy(src, dest) {
  return new Promise((resolve, reject) => {
    const read = fs.createReadStream(src);
    read.on('error', reject);
    const write = fs.createWriteStream(dest);
    write.on('error', reject);
    write.on('finish', resolve);
    read.pipe(write);
  });
}

// https://github.com/filamentgroup/directory-encoder/blob/master/lib/svg-uri-encoder.js
function encodeSVG(buffer) {
  return (
    encodeURIComponent(
      buffer
        .toString('utf-8')
        // strip newlines and tabs
        .replace(/[\n\r]/gim, '')
        .replace(/\t/gim, ' ')
        // strip comments
        .replace(/<!--(.*(?=-->))-->/gim, '')
        // replace
        .replace(/'/gim, '\\i')
    )
      // encode brackets
      .replace(/\(/g, '%28')
      .replace(/\)/g, '%29')
  );
}
